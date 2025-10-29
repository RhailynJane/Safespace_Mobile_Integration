#!/usr/bin/env node
/**
 * Script to find all Image components that should be optimized
 * Run: node scripts/find-images-to-optimize.js
 */

const fs = require('fs');
const path = require('path');

const searchDirs = [
  path.join(__dirname, '..', 'app'),
  path.join(__dirname, '..', 'components'),
];

const excludeDirs = ['node_modules', '.expo', 'dist', 'build'];

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findTsxFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for Image imports from react-native
  if (content.includes('from "react-native"') || content.includes("from 'react-native'")) {
    const importMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-native['"]/);
    if (importMatch && importMatch[1].includes('Image')) {
      // Check if Image is actually used with uri
      const imageWithUriRegex = /<Image[^>]*source\s*=\s*{{\s*uri:/g;
      const matches = content.match(imageWithUriRegex);
      
      if (matches && matches.length > 0) {
        issues.push({
          file: filePath,
          count: matches.length,
          hasOptimizedImage: content.includes('OptimizedImage'),
          recommendation: 'Replace <Image source={{ uri: ... }}> with <OptimizedImage>'
        });
      }
    }
  }
  
  return issues;
}

console.log('🔍 Searching for Image components that need optimization...\n');

const allFiles = [];
searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    findTsxFiles(dir, allFiles);
  }
});

const allIssues = [];
allFiles.forEach(file => {
  const issues = analyzeFile(file);
  if (issues.length > 0) {
    allIssues.push(...issues);
  }
});

if (allIssues.length === 0) {
  console.log('✅ No unoptimized Image components found!');
} else {
  console.log(`Found ${allIssues.length} file(s) with unoptimized images:\n`);
  
  allIssues.forEach((issue, index) => {
    const relativePath = path.relative(process.cwd(), issue.file);
    console.log(`${index + 1}. ${relativePath}`);
    console.log(`   - ${issue.count} Image component(s) with uri`);
    if (issue.hasOptimizedImage) {
      console.log(`   - Already imports OptimizedImage (partial migration)`);
    }
    console.log(`   - ${issue.recommendation}\n`);
  });
  
  console.log('📖 See PERFORMANCE-FIX.md for migration instructions');
}

console.log('\n✨ Done!');
