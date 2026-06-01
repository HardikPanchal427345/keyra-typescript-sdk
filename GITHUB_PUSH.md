# Push to GitHub (do not use the web “Upload files” UI)

Use **Git in the terminal** — one push uploads everything correctly (~25 files with `.gitignore`).

```bash
cd keyra-server-sdk

git add .
git status   # should NOT list node_modules/, dist/, .env

git commit -m "Initial release: KEYRA TypeScript server SDK"

git branch -M main
git remote add origin git@github.com:Ciright-Inc/keyra-server-sdk.git
git push -u origin main
```

Replace `Ciright-Inc/keyra-server-sdk` with your org/repo name.
