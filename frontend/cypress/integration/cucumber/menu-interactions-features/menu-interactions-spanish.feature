Feature: Menu interactions

  Background: Mocks
    Given Backend data is set to be mocked
    And Vars data is set to be mocked in spanish
    And Origin "https://mips.makerdao.com" is set to be mocked as baseUrl with alias "mips"
    And Origin "http://chat.makerdao.com" is set to be mocked as fake site with alias "chat"
    And Origin "https://forum.makerdao.com" is set to be mocked as fake site with alias "chat"

  #Spanish

  Scenario Outline: Navigates to corresponding view wen clicking non-dropdown menu items (Spanish)
    Given The user opens the main page
    And The user selects "Spanish" language
    When Menu "<menu>" is open
    And Leaf menu item "<subMenu>" is clicked
    Then Should visit "<url>"

    Examples:
      | menu              | subMenu                     | url                                                                                                                                        |
      | Aprende           | Intro para Autores          | /mips/md-viewer?mdUrl=https:%2F%2Fraw.githubusercontent.com%2Fmakerdao%2Fmips%2Fmaster%2Fmeta%2Fprimer_for_authors%2Fprimer_for_authors.md |
      | Aprende           | El Framework de MIP         | /mips/details/MIP0                                                                                                                         |
      | Aprende           | Ciclo de Gobernanza Mensual | /mips/details/MIP51                                                                                                                        |
      | Vistas            | MIP Sets                    | /mips/list?mipsetMode=true                                                                                                                 |
      | Vistas            | Propuestas Registrales      | /mips/list?search=$AND(@Accepted,%23living)                                                                                                |
      | Vistas            | Procesos                    | /mips/list?search=$AND(%23process,@ACCEPTED)&orderDirection=ASC&hideParents=false                                                          |
      | Ponte en Contacto | Foro                        | forum.makerdao.com/c/mips/                                                                                                                 |
      | Ponte en Contacto | Chat                        | chat.makerdao.com                                                                                                                          |
