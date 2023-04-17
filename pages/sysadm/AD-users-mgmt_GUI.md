# Tableau dynamique de vue des utilisateurs d'un AD

PowerShell qui récupère une liste d'utilisateurs à partir d'Active Directory et affiche les informations dans une interface graphique basée sur WPF (Windows Presentation Foundation). Voici un résumé des principales fonctionnalités du script :

Importe les assemblies nécessaires pour utiliser WPF et Windows Forms.
Crée une fenêtre WPF contenant une zone de texte (TextBox) pour filtrer les résultats et une grille de données (DataGrid) pour afficher les informations des utilisateurs.
Crée un DataTable pour stocker les informations des utilisateurs avec les propriétés "Name", "SamAccountName", "UserPrincipalName", "EmailAddress", "Department", "lastLogon", "pwdLastSet", "whenCreated" et "whenChanged".
Récupère les utilisateurs depuis Active Directory en incluant toutes les propriétés spécifiées.
Parcourt les utilisateurs récupérés et ajoute leurs informations au DataTable.
Associe le DataTable à la DataGrid pour afficher les informations des utilisateurs dans l'interface graphique.
Ajoute un événement "TextChanged" à la TextBox pour filtrer les résultats affichés dans la DataGrid en fonction du texte saisi par l'utilisateur. La recherche s'effectue sur les colonnes "Name", "UserPrincipalName", "SamAccountName", "EmailAddress" et "Department".
Affiche la fenêtre WPF et attend que l'utilisateur la ferme.
En résumé, ce script récupère les informations des utilisateurs à partir d'Active Directory, les stocke dans un DataTable, les affiche dans une interface graphique basée sur WPF et permet à l'utilisateur de filtrer les résultats en fonction de certaines propriétés.

```powershell
# Importez les assembly nécessaires pour utiliser WPF et Windows Forms
Add-Type -AssemblyName PresentationFramework
[System.Windows.Forms.Application]::EnableVisualStyles()

# Créez une fenêtre WPF
[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Name="Window" Title="Liste des Utilisateurs AD" WindowStartupLocation="CenterScreen" Width="800" Height="600">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>
        <TextBox x:Name="FilterBox" Grid.Row="0" Margin="5" />
        <DataGrid x:Name="DataGrid" Grid.Row="1" Margin="5" AutoGenerateColumns="True" />
    </Grid>
</Window>
"@

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)

# Créez un DataTable pour stocker les informations des utilisateurs
$usersTable = New-Object System.Data.DataTable
$properties = @("Name", "SamAccountName", "UserPrincipalName", "EmailAddress", "Department", "lastLogon", "pwdLastSet", "whenCreated", "whenChanged")

foreach ($property in $properties) {
    $usersTable.Columns.Add($property) | Out-Null
}

# Récupérez les utilisateurs depuis Active Directory
$users = Get-ADUser -Filter * -Properties $properties

# Ajoutez les utilisateurs au DataTable
foreach ($user in $users) {
    $userRow = $usersTable.NewRow()
    foreach ($property in $properties) {
        if ($property -eq "lastLogon" -or $property -eq "pwdLastSet") {
            $userRow[$property] = [DateTime]::FromFileTime($user.$property).ToString("yyyy-MM-dd - HH:mm:ss")
        } else {
            $userRow[$property] = $user.$property
        }
    }
    $usersTable.Rows.Add($userRow)
}

# Associez le DataTable à la DataGrid
$window.FindName("DataGrid").ItemsSource = $usersTable.DefaultView

# Ajoutez un événement pour filtrer les résultats lorsque l'utilisateur tape dans la TextBox
$window.FindName("FilterBox").Add_TextChanged({
    $filterText = $window.FindName("FilterBox").Text
    $window.FindName("DataGrid").ItemsSource.RowFilter = "Name LIKE '%$filterText%' OR UserPrincipalName LIKE '%$filterText%' OR SamAccountName LIKE '%$filterText%' OR EmailAddress LIKE '%$filterText%' OR Department LIKE '%$filterText%'"
})

# Affichez la fenêtre WPF
$window.ShowDialog() | Out-Null

```