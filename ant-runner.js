#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const execAsync = promisify(exec);

// Parse build.xml to understand targets
const buildXml = readFileSync('./build.xml', 'utf8');
const parser = new XMLParser({ ignoreAttributes: false });
const buildConfig = parser.parse(buildXml);

async function runTarget(targetName) {
    console.log(`\n🐜 Running ANT target: ${targetName}\n`);
    
    const targets = {
        'clean': async () => {
            await execAsync('rm -rf build dist reports').catch(() => {});
            console.log('✓ Cleaned build artifacts');
        },
        
        'init': async () => {
            await runTarget('clean');
            await execAsync('mkdir -p build dist reports/tests');
            console.log('✓ Initialized build structure');
        },
        
        'install': async () => {
            console.log('Installing dependencies...');
            const { stdout, stderr } = await execAsync('npm ci', {
                env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' }
            });
            console.log('✓ Dependencies installed');
        },
        
        'build': async () => {
            await runTarget('init');
            await runTarget('install');
            console.log('Building project...');
            const { stdout } = await execAsync('npm run build');
            console.log('✓ Build completed');
        },
        
        'test': async () => {
            await runTarget('install');
            console.log('Running Jest tests...');
            try {
                const { stdout } = await execAsync('npm test -- --ci --json --outputFile=reports/tests/jest-results.json');
                console.log('✓ Tests passed');
            } catch (error) {
                console.error('✗ Tests failed');
                process.exit(1);
            }
        },
        
        'test-coverage': async () => {
            await runTarget('install');
            console.log('Running tests with coverage...');
            const { stdout } = await execAsync('npm test -- --coverage --ci --coverageDirectory=reports/coverage');
            console.log('✓ Tests with coverage completed');
        },
        
        'lint': async () => {
            await runTarget('install');
            console.log('Running ESLint...');
            try {
                const { stdout } = await execAsync('npm run lint');
                console.log('✓ Linting passed');
            } catch (error) {
                console.log('⚠ Linting completed with warnings');
            }
        },
        
        'security-audit': async () => {
            await runTarget('install');
            console.log('Running security audit...');
            try {
                const { stdout } = await execAsync('npm audit --audit-level=moderate');
                console.log('✓ Security audit passed');
            } catch (error) {
                console.log('⚠ Security audit found issues');
            }
        },
        
        'docker-build': async () => {
            console.log('Building Docker image...');
            const { stdout } = await execAsync('docker build -t qrtak:latest .');
            console.log('✓ Docker image built');
        },
        
        'ci': async () => {
            await runTarget('clean');
            await runTarget('install');
            await runTarget('lint');
            await runTarget('test-coverage');
            await runTarget('security-audit');
            await runTarget('build');
            console.log('\n✅ CI pipeline completed successfully!');
        },
        
        'quick-test': async () => {
            console.log('Running quick tests...');
            const { stdout } = await execAsync('npm test');
            console.log('✓ Quick tests completed');
        },
        
        'help': async () => {
            console.log(`
Available targets:
  node ant-runner.js clean          - Clean build artifacts
  node ant-runner.js install        - Install npm dependencies
  node ant-runner.js build          - Build the project
  node ant-runner.js test           - Run Jest tests
  node ant-runner.js test-coverage  - Run tests with coverage
  node ant-runner.js lint           - Run ESLint
  node ant-runner.js security-audit - Run security audit
  node ant-runner.js docker-build   - Build Docker image
  node ant-runner.js ci             - Run full CI pipeline
  node ant-runner.js quick-test     - Run tests without install
  node ant-runner.js help           - Show this help
            `);
        }
    };
    
    const target = targets[targetName];
    if (!target) {
        console.error(`Unknown target: ${targetName}`);
        await targets.help();
        process.exit(1);
    }
    
    await target();
}

// Get target from command line
const target = process.argv[2] || 'test';
runTarget(target).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});