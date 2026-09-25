# Xaltos-plays-Bitburner

Im Zeitraum Mai 2026 habe ich das Spiel Bitburner zufällig gefunden und dann für fast 5 Monate gespielt.
Am Anfang hatte ich fast keine JavaScript Skills. In den Monaten hat sich das aber mit viel googlen und so manch einer KI Anfrage deutlich verbessert.

Inzwischen habe ich fast jeden BitNote 3 mal gespielt, so das ich bereit bin mir ein neues Spiel zu suchen.
Da ich in der Zeit massive von anderen Spielern gelernt habe, möchte ich  meinen aktuellen Stand der Scripte veröffentlichen.


### Hier eine Übersicht der wichtigsten Scripte:

**Menu.ts**  
Ein einfaches Menü zum starten und beenden der wichtigsten Scripte.  
Besonderheiten:  Laufende Scripte kann man am Zusatz "(läuft)" erkennen.  
Mit einem Aufruf "-<Nr>" kann man ein Script auch wieder anhalten.  
Bei mir habe ich den Scriptstart mit einem alias Befehl auf "m" gesetz, da man hier sehr oft ran muss.


## Hacking
**network_hack.js**  
Auf allen verfügbaren Servern werden nach Möglichkeit die Ports geöffnet und Root Rechte erlangt.
Wenn das geklappt hat wird das Script basic_hack.ts auf den Server kopiert und dort endlos ausgeführt.
Das Script basic_hack.ts ist sehr einfach und im aktuellen Zustand dafür vorgesehen den Hacking Level zu boosten ohne das als zu viel Geld eingenommen wird.
(Ein guter Einstieg zum lernen.)

**Hack_Starter.ts**  
Startes HWGW Script zum Geld verdienen.
Im Hintergrund werden die Script work/DelayHack.js, work/DelayGrow.js und work/DelayHack.js zeitversetzt gestartet.
Das Skript prüft die Server regelmäßig und erkennt und nutzt alle verfügbaren Resourcen.
Ich vermute das ist eins der besten Scripte.

## Infos  
**scan_running_prog.ts**  
Eine Übersicht der laufenden Delay*.js scripte (Gestartet von Hack_Starter.ts)
Hier kann man sehr verfolgen was grade passiert und wie lange man noch warten muss bis sich etwas tut.

**GetInfo.js**  
Eine Liste aller hackbaren Server mit den wichtigsten Infos (Server | Security | Money | Weak | Ports |Hacklevel | HackChance| *Infos von Hack_Starter.ts*)
Sehr nützlich :D

**ShowHackedServers.js**  
Eine Liste aller Server die man zum Hacken verwenden kann.
Nicht so nützlich.

## Tools
**jump.js  <Servername>**  
Sprung zu einem Server der keine direkte Verbindung zu home hat.  Eine echte Erleichterung wenn man sich mal von Hand von einem Server zum nächsten gehangelt hat.


**work/purchaseProgram.ts**  
Kauf die wichtigsten Programme aus dem Darkweb. 
(Tipp:  Man kann die Programme mit den Darkweb scripten auch 'finden'. Das spart viel Geld.)

**InstallBackdoor.ts**  
Installiert eine Backdoor bei den wichtigen Factions Servern.  ("CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "fulcrumassets")

**autoSolver.js**  
Es werden Contracts automatisch  angenommen und abgeschlossen.
Hier fehlen noch  viel Contracts-Arten, so das oft nur 50% der Verträge gelöst wedren können.

## Gang
**Gang_Manager.ts**  
Ein Script das automatisch eine Gang aufbaut und verbessert.  Nur für Crime Gangs geeignet.  Nicht für den Gangkrieg vorgesehen

**Gang_Warfare.ts**  
 Modus für einen Gangkrieg.  Es wird zeitanhängig der Modus gewechselt so das man Stäkre und Geld gleichzeitig sammeln kann.

## Darkweb
**DarkServer.ts** und **Darkweb.ts**  
Das Programm Darkweb.ts verteil sich wie ein Wurm im Darkweb. Kann sich dabei aber immer nur auf die aktuellen Nachbarn verteilen, wenn grade eine Verbindung besteht und das Passwort ermittelt wurde.  
Das Script hat hier noch Schwächen, ist aber gut genug um sich bis nach ganz unten vor zu kämpfen.  
Das Programm DarkServer läuft auf Home und sammeln die gefunden Passwörter und organisiert wo ein StasisLink gesetzt werden soll.  

Man muss das Darkweb mehrfach abschließen.   
Bei den ersten zwei Durchläufen muss man das Labyrint noch manuell durchlaufen. (Steuerung:  N,S,W,E)  
Ab dem dritten Durchlauf muss man das Labyrint per Script durchlaufen. 

Das durchlaufen eines großen Labyrint braucht Zeit, daher ist es wichtig das man vorher einen StasisLink mit direktem Zugang zum Labyrint setzt.  
Danach kann man dort mit connect hinspringen, das Darkweb.ts Script manuell anpassen und dort die Logik für das Labyrint aktivieren.  
Das Script ist aktuell nicht gut genug um den Weg selber zu finden. Statt dessen wird ein Plan gezeichnet und an jeder Kreuzung wird man gefragt wohin man möchte.  (w,a,s,d Steuerung)  
Ein hoher Charisma Wert (2000+) kann hier die Laufzeit deutlich beschleunigen.  


## Stanek's Gift
**Stanek/Start_all.ts** und **Stanek/kill_Start.ts**  
Starten und Beenden des Aufladen für die Stanek Buffs.   Im Vorfeld muss man manuell die passenden Fragmente plazieren.


## Stock Market
**stock.ts** und **stock2.ts**  
Erste Versuche um mit dem Stock Market Geld zu verdienen.  Noch nicht wirklich gut.

**stock3.ts**  
Das Script kann auf zwei Arten betrieben werden.  
Mit "4S Market Data UI Access":   Das Script ließt die Daten aus der Web-Seite. Man muss aber den Reiter "Stock Market" dauerhaft offen haben.  
Mit "4S Market Data API Access":  Jetzt kappt es auch ohne den offenen Reiter.  


## Abschluss
Alle Scripte sind auf dem Stand v3.0.1
Ich bin durch mit dem Spiel, ich werden die Scripte nicht weiter pflegen.
Teilweise muss man die Script noch manuell an den aktuellen BitNote anpassen. 
Das sind die Scripte am Ende des Spiels mit allen möglichen Erweierungen.  Nicht alle werden bei dir sofort funktionieren.

Viel Spaß mit BitBurner und Happy Hacking

Xaltos  25.9.2026






























