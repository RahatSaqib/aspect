Feature: Login Page
  Scenario: Try to login with admin and lower level users checking the menu we receive.
    Given The browser is open
    When open the page "http://next-release.aspect.id/login"
    Then  Search for html element "loginSubmit"
    Then Type "<user>" in "user" TextField   
    Then Type "<password>" in "password" TextField
    Then Click Submit button
    Then Has to have this menu "<menuItem>"
    Examples:
        | user | password | menuItem |
        | Clinician_US  | clinician_us  | Home,Task List,Browse,Reports  |
        | technician_us  | technician_us  | Operational Data,Reports |
        | admin  | test07  | Home,Task List,Operational Data,Browse,Reports  |
        
        
    