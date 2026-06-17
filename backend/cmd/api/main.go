package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/BrunoCarvalhoCagni/taskflow/internal/handlers"
	"github.com/BrunoCarvalhoCagni/taskflow/internal/models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system default environment variables")
	}

	// 2. Database Connection
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"), os.Getenv("DB_PORT"),
	)

	// We use Info log mode to see every SQL query in the terminal during development
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// 3. Database Migration
	// Automatically creates/updates tables based on Go structs
	if err := db.AutoMigrate(&models.Task{}); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// 4. Server Setup (Gin)
	r := gin.Default()

	// Security: Set trusted proxies to nil to avoid the startup warning
	r.SetTrustedProxies(nil)

	// Security: CORS Configuration (Including PATCH for Drag & Drop)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 5. Dependency Injection
	// Passing the DB instance to our handlers
	taskHandler := handlers.NewTaskHandler(db)

	// 6. API Routes
	api := r.Group("/api")
	{
		api.GET("/tasks", taskHandler.GetTasks)
		api.POST("/tasks", taskHandler.CreateTask)
		api.PATCH("/tasks/:id/status", taskHandler.UpdateTaskStatus)
	}

	// 7. Graceful Shutdown Implementation
	
	// Define the HTTP Server configuration
	srv := &http.Server{
		Addr:    ":" + os.Getenv("PORT"),
		Handler: r,
	}

	// Run the server in a separate goroutine so it doesn't block
	go func() {
		log.Printf("Server starting on port %s", os.Getenv("PORT"))
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("Listen error: %s\n", err)
		}
	}()

	// Create a channel to listen for OS signals (SIGINT/SIGTERM)
	quit := make(chan os.Signal, 1)
	// SIGINT: Ctrl+C, SIGTERM: Sent by Docker/Kubernetes/Cloud on shutdown
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Block the main thread here until a signal is received
	<-quit
	log.Println("Shutting down server...")

	// Create a context with a 5-second timeout for the shutdown process
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Attempt to shutdown the server gracefully, closing active connections
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	log.Println("Server exiting gracefully")
}