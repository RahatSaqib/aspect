Feature: Login Page
  Scenario: Try to login with admin and lower level users checking the menu we receive.
    Given The browser is open
    When open the page "http://localhost:8000/login"
    Then  Search for "alt="Aspect" attribute in type "img"
    Then Type "admin" in "user" TextField   
    Then Type "test07" in "password" TextField
    Then  Click Submit button
    # Then Receive text "Browse"
            # | name           | description                                |
            # | Phone XL       | A large phone with one of the best screens |
            # | Phone Mini     | A great phone with one of the best cameras |
            # | Phone Standard |                                            |