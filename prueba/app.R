library(shiny)


ui<-  fluidPage(
    
    titlePanel("Navlist panel example"),
    
    navlistPanel(
      "Header",
      tabPanel("First",
               h3("This is the first panel")
      ),
      tabPanel("Second",
               h3("This is the second panel")
      ),
      tabPanel("Third",
               h3("This is the third panel")
      )
    )
  )



server<-function(input, output) {
  
  output$scatterPlot <- renderPlot({
    x <- rnorm(input$n)
    y <- rnorm(input$n)
    plot(x, y)
  })
  
}




shinyApp(ui, server)