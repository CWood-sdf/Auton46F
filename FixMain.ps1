$uri = "https://localhost:5001"
$webreq = Invoke-WebRequest -Uri $uri
$webreq.Content | Out-File -FilePath index.html
$mainPage = Get-Content index.html
$jsRegex = "<script src="

$cssRegex = '<link rel="stylesheet" href='
$newPage = ""
ForEach ($line in $($mainPage -split "`r`n")) {
    if ($line -match $jsRegex) {
        $match = [regex]::Match($line, $jsRegex)
        $index = $match.Index
        $uriStart = $index + $match.Length
        $uriEnd = $line.IndexOf('"', $uriStart + 1)
        $suburi = $line.Substring($uriStart + 1, $uriEnd - $uriStart - 1)
        Write-Output $suburi
        # get the contents of the file at the uri and add it to newPage
        $webreq = Invoke-WebRequest -Uri $($uri + $suburi)
        $str = $webreq.Content
        # if the first character of str isn't a '/', remove first 3 characters
        if ($str[0] -ne '/') {
            $str = $str.Substring(3)
        }
        $newPage += "<script>" + $str + "</script>`r`n"
    }
    elseif ($line -match $cssRegex) {
        $match = [regex]::Match($line, $cssRegex)
        $index = $match.Index
        $uriStart = $index + $match.Length
        $uriEnd = $line.IndexOf('"', $uriStart + 1)
        $suburi = $line.Substring($uriStart + 1, $uriEnd - $uriStart - 1)
        Write-Output $suburi
        # get the contents of the file at the uri and add it to newPage
        $webreq = Invoke-WebRequest -Uri $($uri + $suburi)
        $str = $webreq.Content
        # if the first character of str isn't a '/', remove first 3 characters
        if ($str[0] -ne '/') {
            $str = $str.Substring(3)
        }
        $newPage += "<style>" + $str + "</style>`r`n"
    }
    else {
        $newPage += $line + "`r`n"
    }
}
$newPage | Out-File -FilePath index.html