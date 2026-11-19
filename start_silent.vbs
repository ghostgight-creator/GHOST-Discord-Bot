Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\adham\.gemini\antigravity\scratch\GHOST-Discord-Bot"
WshShell.Run "node dist/index.js", 0, False
