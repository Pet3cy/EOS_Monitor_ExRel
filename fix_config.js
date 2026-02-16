const fs = require('fs');

// Fix package.json
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// Remove duplicates by rebuilding devDependencies explicitly or just letting JS object behavior handle it (last write wins),
// but wait, JSON.parse handles duplicate keys by taking the LAST one.
// The file content shows duplicate keys.
// However, reading it with JSON.parse might not show them if it already filtered.
// But writing it back will clean it up.
// Let's ensure we keep the desired versions.

const desiredDevDeps = {
  ...pkg.devDependencies,
  "jsdom": "^28.1.0",
  "@testing-library/react": "^16.3.2",
  "@testing-library/jest-dom": "^6.9.1"
};

pkg.devDependencies = desiredDevDeps;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Fixed package.json');

// Fix vite.config.ts
let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
// The duplicate build block is at the end.
// We can just remove the second occurrence.
const buildBlock = `      build: {
        outDir: 'Frontend/build'
      }`;

// Find last occurrence and remove it if it exists more than once
const parts = viteConfig.split('build: {');
if (parts.length > 2) {
    // Reconstruct without the last part's build block
    // This is tricky with string manipulation.
    // Let's just use replace with a specific pattern if possible, or manual splicing.

    // The file ends with:
    //       },
    //       build: {
    //         outDir: 'Frontend/build'
    //       }
    //     };
    // });

    // Let's try to remove the specific duplicate block at the end.
    const duplicatePattern = /,\s+build:\s+{\s+outDir:\s+'Frontend\/build'\s+}\s+};/g;

    // Check if we can find the pattern
    if (duplicatePattern.test(viteConfig)) {
        viteConfig = viteConfig.replace(duplicatePattern, '\n    };');
        fs.writeFileSync('vite.config.ts', viteConfig);
        console.log('Fixed vite.config.ts');
    } else {
        console.log('Could not match duplicate build block pattern in vite.config.ts');
        // fallback: read file and print to debug
        console.log(viteConfig);
    }
} else {
    console.log('vite.config.ts does not seem to have duplicate build blocks based on split check.');
}
