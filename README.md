# JS TOOLS
helps you manage the wrpp datas sets

---

```
  usage:
    main <command>

    commands can be:

    parse-gen-langs :      db-podcast-export-languages.js
                            -->
                               output/unknown-langs.json
                               output/known-langs.json
                               output/unkown-langs-groups-names-referential.json
                               output/kown-langs-groups-names-referential.json

    build-podcasts-lists :  podcastindex_feeds.db.csv
                            output/known-langs.json
                            output/unkown-langs-groups-names-referential.json
                            output/kown-langs-groups-names-referential.json
                             -->
                              output/podcasts-lists.json
                              output/podcasts-lists-lang.json
                              output/podcasts-lists-flat-langs.json

    build-unicode-map :     ucd.all.grouped.xml
                              -->
                                output/unicode-map.json
```