import re

# Update vite.config.ts
vite_config_path = 'vite.config.ts'
with open(vite_config_path, 'r') as f:
    vite_content = f.read()

if "build: {" not in vite_content:
    # Insert build config before resolve
    vite_content = vite_content.replace(
        "resolve: {",
        "build: {\n        outDir: 'Frontend/build',\n      },\n      resolve: {"
    )
else:
    # If build block exists (which it doesn't in the current file), we would update it
    pass

with open(vite_config_path, 'w') as f:
    f.write(vite_content)

# Update server.ts
server_path = 'server.ts'
with open(server_path, 'r') as f:
    server_content = f.read()

server_content = server_content.replace(
    'app.use(express.static("dist"));',
    'app.use(express.static("Frontend/build"));'
)

with open(server_path, 'w') as f:
    f.write(server_content)

print("Updated vite.config.ts and server.ts")
