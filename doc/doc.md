# launch (powserShell)
cls ; node --trace-warnings main.js "command"

# exports: podcastindex_feeds.db

Select-String -Path output.csv -Pattern 'legend"'


.\sqlite3 -header -csv .\podcastindex_feeds.db "SELECT * FROM podcasts;" > output.csv

.\sqlite3 -header -csv -separator '📚|📚' .\podcastindex_feeds.db "SELECT * FROM podcasts limit 100" > output.csv

.\sqlite3 -header -csv -separator '📚|📚' .\podcastindex_feeds.db "SELECT * FROM podcasts" > output.csv


.\sqlite3.exe .\podcastindex_feeds.db 'select count(*) from podcasts' > count.txt

.\sqlite3.exe .\podcastindex_feeds.db 'select distinct language as lng from podcasts order by lng' > languages.txt

.\sqlite3.exe .\podcastindex_feeds.db .schema > schema.txt

.\sqlite3.exe .\podcastindex_feeds.db 'select concat(''"'',language,''"'',''|'', count(*),'','') from podcasts group by language' > languages2.txt

.\sqlite3.exe .\podcastindex_feeds.db 'select concat(''["'',language,''",'',count(*),''],'') from podcasts group by language' > languages.js
