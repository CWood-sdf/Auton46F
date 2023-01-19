$LayoutPage = ""
Get-Content -Path Pages/Shared/_Layout.cshtml | ForEach-Object {
    $LayoutPage += $_ + "`r`n"
}
$IndexPage = ""
Get-Content -Path Pages/Index.cshtml | ForEach-Object {
    $IndexPage += $_ + "`r`n"
}
# Replace the @renderBody() with nothing
$LayoutPage = $LayoutPage.Replace("@RenderBody()", "")
#Get the @section Scripts { } block
$scriptMatch = [regex]::Match($IndexPage,"@section\s+Scripts\s+{[^}]*}")
#write the script block to a variable
$scriptBlock = $scriptMatch.Groups[0].Value
#remove "@section Scripts {"
$startMatch = [regex]::Match($scriptBlock,"@section\s+Scripts\s+{")
$scriptBlock = $scriptBlock.Substring($startMatch.Length)
#remove the last "}"
$scriptBlock = $scriptBlock.Substring(0,$scriptBlock.Length - 1)
#replace the @RenderSection("Scripts") with the script block
$LayoutPage = $LayoutPage.Replace("@RenderSection(""Scripts"", required: false)",$scriptBlock)
# Write-Output $LayoutPage
$jsRegex = "<script src="

$cssRegex = '<link rel="stylesheet" href='
$newPage = ""

$uri = "wwwroot"
ForEach ($line in $($LayoutPage -split "`r`n")) {
    if ($line -match $jsRegex) {
        $match = [regex]::Match($line, $jsRegex)
        $index = $match.Index
        $uriStart = $index + $match.Length
        $uriEnd = $line.IndexOf('"', $uriStart + 1)
        $suburi = $line.Substring($uriStart + 2, $uriEnd - $uriStart - 2)
        Write-Output $suburi
        # get the contents of the file at the uri and add it to newPage
        $webreq = ""
        Get-Content -Path $($uri + $suburi) | ForEach-Object {
            $webreq += $_ + "`r`n"
        }
        $str = $webreq
        $newPage += "<script>" + $str + "</script>`r`n"
    }
    elseif ($line -match $cssRegex) {
        $match = [regex]::Match($line, $cssRegex)
        $index = $match.Index
        $uriStart = $index + $match.Length
        $uriEnd = $line.IndexOf('"', $uriStart + 1)
        $suburi = $line.Substring($uriStart + 2, $uriEnd - $uriStart - 2)
        Write-Output $suburi
        # get the contents of the file at the uri and add it to newPage
        $webreq = ""
        Get-Content -Path $($uri + $suburi) | ForEach-Object {
            $webreq += $_ + "`r`n"
        }
        $str = $webreq
        $newPage += "<style>" + $str + "</style>`r`n"
    }
    else {
        $newPage += $line + "`r`n"
    }
}

Write-Output "Writing to file"
$newPage | Out-File -FilePath index.html
Write-Output "Done"