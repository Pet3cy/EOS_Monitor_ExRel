const fs = require('fs');

// 1. Fix package.json
try {
    const pkgContent = fs.readFileSync('package.json', 'utf8');
    // We can't use JSON.parse because it discards duplicate keys without warning.
    // But duplicate keys are invalid JSON anyway.
    // If we parse it, we get an object.
    const pkg = JSON.parse(pkgContent);

    // Explicitly set desired versions to fix duplicates and ensure correctness
    pkg.devDependencies['jsdom'] = '^28.1.0';
    pkg.devDependencies['@testing-library/react'] = '^16.3.2';
    pkg.devDependencies['@testing-library/jest-dom'] = '^6.9.1';

    // Remove the older versions if they were separate keys (JSON.parse merges them so this is implicit)
    // But we should verify if there are other keys.
    // Actually, writing it back stringified will remove the duplicates in the file.

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('Fixed package.json duplicates.');
} catch (e) {
    console.error('Error fixing package.json:', e);
}

// 2. Fix vite.config.ts
try {
    let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');

    // The duplicate block looks like:
    //       build: {
    //         outDir: 'Frontend/build'
    //       }
    //     };

    // We want to remove the LAST occurrence of "build: {" block if it appears twice.

    const buildKey = 'build: {';
    const firstIndex = viteConfig.indexOf(buildKey);
    const lastIndex = viteConfig.lastIndexOf(buildKey);

    if (firstIndex !== -1 && firstIndex !== lastIndex) {
        console.log('Found duplicate build block in vite.config.ts. Removing the second one.');

        // Remove from lastIndex up to the matching closing brace of that block
        // It's safer to just replace the known string if it matches exactly what we saw earlier.
        // The earlier cat output showed:
        //       resolve: {
        //         alias: {
        //           '@': path.resolve(__dirname, '.'),
        //         }
        //       },
        //       build: {
        //         outDir: 'Frontend/build'
        //       }
        //     };
        // });

        const toRemove = `
      build: {
        outDir: 'Frontend/build'
      }`;

        // Try to replace the exact string at the end of the return object
        // The indentation might vary slightly, so let's be careful.
        // Let's inspect the file content around the second occurrence.

        // We can just execute a replacement of the second occurrence.
        // But let's verify context.

        const contentBefore = viteConfig.substring(0, lastIndex);
        const contentAfter = viteConfig.substring(lastIndex);

        // The second block should be removed.
        // It likely ends with `    };`

        // Let's use a regex to match the duplicate block at the end of the return object.
        // It matches `build: { ... }` followed by `};`

        const regex = /,\s+build:\s+\{\s+outDir:\s+'Frontend\/build'\s+\}\s+};/s;
        if (regex.test(viteConfig)) {
             viteConfig = viteConfig.replace(regex, '\n    };');
             fs.writeFileSync('vite.config.ts', viteConfig);
             console.log('Fixed vite.config.ts via regex.');
        } else {
             // Fallback: try manual splice if we are sure about the structure
             console.log('Regex did not match. Attempting manual splice based on lastIndexOf.');
             // Find the closing brace of the config object (which is `};`)
             const configEnd = viteConfig.lastIndexOf('};');
             if (configEnd > lastIndex) {
                 // The block is between lastIndex and some closing brace.
                 // It's `build: { outDir: 'Frontend/build' }`
                 // Let's just comment it out or remove it.

                 // Check if there is a comma before it.
                 const commaIndex = viteConfig.lastIndexOf(',', lastIndex);
                 if (commaIndex !== -1) {
                     const newContent = viteConfig.substring(0, commaIndex) + viteConfig.substring(configEnd);
                     // This might mess up if there are comments or other things.
                     // Let's be safer: read the file lines and filter.

                     const lines = viteConfig.split('\n');
                     let buildCount = 0;
                     const newLines = [];
                     let insideDuplicate = false;

                     for (let i = 0; i < lines.length; i++) {
                         const line = lines[i];
                         if (line.includes('build: {')) {
                             buildCount++;
                             if (buildCount > 1) {
                                 insideDuplicate = true;
                                 continue; // Skip this line
                             }
                         }

                         if (insideDuplicate) {
                             if (line.includes('}')) {
                                 insideDuplicate = false; // End of block
                             }
                             continue;
                         }

                         newLines.push(line);
                     }

                     fs.writeFileSync('vite.config.ts', newLines.join('\n'));
                     console.log('Fixed vite.config.ts via line filtering.');
                 }
             }
        }
    } else {
        console.log('No duplicate build block found in vite.config.ts');
    }

} catch (e) {
    console.error('Error fixing vite.config.ts:', e);
}
