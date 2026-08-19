Port Settings:

- USB
- Ethernet
  -> IP Addr: 102.168.1.100 [Connect Btn]

---

[#Ticket Printer Settings]

| Setting            | Options                                                        | Description                                                                                                            |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Set Printing mode  | ['ASCII','Chinese']                                            | Tryb kodowania znaków używany podczas drukowania.                                                                      |
| Cutting Setting    | ['ON','OFF']                                                   | Automatyczne odcinanie papieru po zakończeniu wydruku.                                                                 |
| Set Density Level  | ['Level1_Light','Level2_Light','Level3_Dark','Level4_Dark']    | Poziom intensywności i zaczernienia wydruku.                                                                           |
| Set Default Char   | ['ASCII:9x17','ASCII:12x24','ASCII:9x24']                      | Domyślny rozmiar znaków tekstowych, określony szerokością i wysokością matrycy punktowej.                              |
| USB PID Set        | ['5011','58Label','58KRY','OPOS','80KRY','POS365']             | Profil identyfikatora produktu USB (PID), wpływający na sposób rozpoznawania drukarki i dobór sterownika przez system. |
| Set Default Page   | [ ${{default_page_list}} ]                                     | Domyślna strona kodowa używana do interpretacji znaków (reguła odwzorowania bajtów na znaki narodowe i symbole).       |
| Setting DHCP       | ['ENABLE','DISABLE']                                           | Automatyczne pobieranie konfiguracji sieciowej przez DHCP.                                                             |
| USB Type           | ['PRINTER','VCOM']                                             | Tryb komunikacji urządzenia przez port USB.                                                                            |
| Print width        | ['80mm','58mm']                                                | Szerokość obszaru drukowania.                                                                                          |
| Set up the buzzer  | ['ON','OFF']                                                   | Sygnalizacja dźwiękowa drukarki (buzzer).                                                                              |
| Set Printer Baud   | ['1200','2400','4800','9600','19200','38400','57600','115200'] | Prędkość transmisji danych dla komunikacji szeregowej.                                                                 |
| Set Font           | ['GB18030','BIG5','Japanese']                                  | Zestaw znaków używany przez drukarkę (dla języków azjatyckich).                                                        |
| Set Voice swith    | ['ON','OFF']                                                   | Obsługa komunikatów głosowych drukarki (unknown).                                                                      |
| USB VID Set        | ['0416','58Label','58KRY','OPOS','80KRY','POS365']             | Identyfikator producenta (VID) urządzenia USB.                                                                         |
| Enable Cutter(PIT) | ['ON','OFF']                                                   | Obsługa mechanizmu odcinania papieru w trybie PIT.                                                                     |
| Setting speed      | ['0','1','2','3','4','5','6']                                  | Poziom prędkości drukowania.                                                                                           |
| USB Port           | ['Fix USB','Random USB']                                       | Sposób przypisywania portu USB do urządzenia.                                                                          |

```javascript
$default_page_list = [
  "OEM437(Std.Europe)",
  "(Katakana)(1)",
  "OEM850(Multiling)",
  "OEM860(Portuguese)",
  "OEM863(Canadian)",
  "OEM865(Nordic)",
  "(West Europe)",
  "(Greek)",
  "(Hebrew)(1)",
  "(East Europe)",
  "(Iran)",
  "WPC1252",
  "OEM866(Cyrillic#)",
  "OEM852(Latin2)",
  "OEM858",
  "(IranII)",
  "(Latvian)",
  "ISO-8859-6(Arabic)",
  "(PT151,1251)",
  "OEM747",
  "WPC1257",
  "(Vietnam)",
  "OEM864",
  "PC1001",
  "(Uigur)",
  "(Hebrew)(2)",
  "WPC1255(Israel)",
  "OEM437(Std.Europe)",
  "(Katakana)(2)",
  "OEM437(Std.Europe)",
  "OEM858(Multiling)",
  "OEM852(Latin-2)",
  "OEM860(Portuguese)",
  "OEM861(Icelandic)",
  "OEM863(Canadian)",
  "OEM865(Nordic)",
  "OEM866(Russian)",
  "OEM855(Bulgarian)",
  "OEM857(Turkey)",
  "OEM862(Hebrew)",
  "OEM864(Arabic)",
  "OEM737(Greek)",
  "OEM851(Greek)",
  "OEM869(Greek)",
  "OEM928(Greek)",
  "OEM772(Lithuanian)",
  "OEM774(Lithuanian)",
  "OEM874(Thai)",
  "WPC1252(Latin-1)",
  "WPC1250(Latin-2)",
  "WPC1251(Cyrillic)",
  "PC3840(Russian)",
  "PC3841(Gost)",
  "PC3843(Polish)",
  "PC3844(CS2)",
  "PC3845(Hungarian)",
  "PC3846(Turkish)",
  "PC3847(Brazil-ABNT)",
  "PC3848(Brazil-ABICOMP)",
  "PC1001(Arabic)",
  "PC2001(Lithuanian)",
  "PC3001(Estonian)",
  "PC3002(Estonian)",
  "PC3011(Latvian)",
  "PC3012(Latvian)",
  "PC3021(Bulgarian)",
  "PC3041(Maltese)",
  "(Thai)",
  "WPC1253(Greek)",
  "WPC1254(Turkish)",
  "WPC1256(Arabic)",
  "OEM720(Arabic)",
  "WPC1258(Vietnam)",
  "OEM775(Latvian)",
  "(Thai2)"
];
```

Additional Buttons:
[ NV Logo Down ] -- non volatile logo of the store that is stored in flash memory of the printer
[ Printer Cut ]
[ Print Default Page ]
[ Restore factory ]
[ Open Cash Box ]
[ Print SelfTest ]
[ Advanced ]
[ Check USB Port ]
[ A4 printer settings ]
