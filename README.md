Simple chrome extension to highligh Greek typos based on grs.

To make it work in Firefox just change the line in `manifest.json`:

```diff
  "background": {
    "type": "module",
-    "service_worker": "js/background.js"
+    "scripts": ["js/background.js"]
  },
```
