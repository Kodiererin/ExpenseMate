# 🧹 ExpenseMate Cleanup Script

## Purpose
This script helps remove unnecessary files after the enterprise transformation of ExpenseMate.

## ⚠️ IMPORTANT - Backup First!
Before running any deletion commands, ensure you have:
1. ✅ Committed all changes to Git
2. ✅ Created a backup of the project
3. ✅ Verified the app works with new features

## Option 1: Manual Cleanup (Recommended)

### Step 1: Remove My Day Feature Files
```powershell
# Navigate to project root
cd c:\1_PersonalProjects\ExpenseMate

# Remove My Day tab
Remove-Item -Path "app\(tabs)\my-day.tsx" -Force

# Remove daily memory utilities
Remove-Item -Path "utils\dayMemoryService.ts" -Force
Remove-Item -Path "utils\dayMemoryReminderService.ts" -Force
Remove-Item -Path "types\DailyMemory.ts" -Force

# Remove daily memory components
Remove-Item -Path "components\DailyMemoryReminderAgent.tsx" -Force
Remove-Item -Path "components\DailyMemorySyncAgent.tsx" -Force
```

### Step 2: Remove Chat Feature Files
```powershell
# Remove chat screen
Remove-Item -Path "app\Chat.tsx" -Force
```

### Step 3: Remove Calculator Feature Files
```powershell
# Remove calculator screens
Remove-Item -Path "app\Calculator.tsx" -Force
Remove-Item -Path "app\CalculatorInfo.tsx" -Force

# Remove calculator utilities
Remove-Item -Path "utils\calculatorUtils.ts" -Force
```

### Step 4: Remove Investment Feature Files (Optional)
```powershell
# Only run if you don't want investment tracking

# Remove investment screen
Remove-Item -Path "app\Investments.tsx" -Force

# Remove investment context
Remove-Item -Path "contexts\InvestmentContext.tsx" -Force

# Remove investment utilities
Remove-Item -Path "utils\investmentService.ts" -Force

# Remove investment types
Remove-Item -Path "types\Investment.ts" -Force
Remove-Item -Path "domain\Investment.ts" -Force

# Remove investment components
Remove-Item -Path "components\InvestmentManagerScreen.tsx" -Force

# Remove investment documentation
Remove-Item -Path "INVESTMENTS_FEATURE.md" -Force
```

### Step 5: Update App Layout (If Removing Investments)
If you removed investment features, update `app\_layout.tsx`:

**Find and remove:**
```typescript
import { InvestmentProvider } from '../contexts/InvestmentContext';

// And remove the InvestmentProvider wrapper
```

### Step 6: Clean Up Package Dependencies (Optional)
Review and remove unused dependencies from `package.json`:

```powershell
# If you removed specific features, you might want to remove their dependencies
# Check if these are still needed:
# - expo-notifications (if was only used for My Day reminders)
# - Any other feature-specific packages
```

## Option 2: Automated PowerShell Script

Save this as `cleanup-unused-features.ps1`:

```powershell
# ExpenseMate Cleanup Script
# Run from project root directory

Write-Host "🧹 ExpenseMate Cleanup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Confirm before proceeding
$confirmation = Read-Host "⚠️  This will delete unused feature files. Have you backed up? (yes/no)"
if ($confirmation -ne 'yes') {
    Write-Host "Cleanup cancelled. Please backup first!" -ForegroundColor Yellow
    exit
}

Write-Host "`n📦 Starting cleanup...`n" -ForegroundColor Green

# Function to safely remove file
function Remove-SafeFile {
    param($Path)
    if (Test-Path $Path) {
        Remove-Item -Path $Path -Force
        Write-Host "✅ Removed: $Path" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $Path" -ForegroundColor Yellow
    }
}

# My Day Feature
Write-Host "`n🗑️  Removing My Day feature files..." -ForegroundColor Cyan
Remove-SafeFile "app\(tabs)\my-day.tsx"
Remove-SafeFile "utils\dayMemoryService.ts"
Remove-SafeFile "utils\dayMemoryReminderService.ts"
Remove-SafeFile "types\DailyMemory.ts"
Remove-SafeFile "components\DailyMemoryReminderAgent.tsx"
Remove-SafeFile "components\DailyMemorySyncAgent.tsx"

# Chat Feature
Write-Host "`n🗑️  Removing Chat feature files..." -ForegroundColor Cyan
Remove-SafeFile "app\Chat.tsx"

# Calculator Feature
Write-Host "`n🗑️  Removing Calculator feature files..." -ForegroundColor Cyan
Remove-SafeFile "app\Calculator.tsx"
Remove-SafeFile "app\CalculatorInfo.tsx"
Remove-SafeFile "utils\calculatorUtils.ts"

# Ask about Investment feature
Write-Host "`n" -ForegroundColor Cyan
$removeInvestments = Read-Host "Remove Investment features too? (yes/no)"
if ($removeInvestments -eq 'yes') {
    Write-Host "`n🗑️  Removing Investment feature files..." -ForegroundColor Cyan
    Remove-SafeFile "app\Investments.tsx"
    Remove-SafeFile "contexts\InvestmentContext.tsx"
    Remove-SafeFile "utils\investmentService.ts"
    Remove-SafeFile "types\Investment.ts"
    Remove-SafeFile "domain\Investment.ts"
    Remove-SafeFile "components\InvestmentManagerScreen.tsx"
    Remove-SafeFile "INVESTMENTS_FEATURE.md"
    
    Write-Host "`n⚠️  Remember to remove InvestmentProvider from app\_layout.tsx" -ForegroundColor Yellow
}

Write-Host "`n✨ Cleanup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Review git diff to see what was removed" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: npx expo start --clear" -ForegroundColor White
Write-Host "4. Test the app thoroughly" -ForegroundColor White
Write-Host "5. Commit changes: git commit -am 'Clean up unused features'" -ForegroundColor White
Write-Host "`n" 
```

**To run the PowerShell script:**
```powershell
# 1. Save the script as cleanup-unused-features.ps1
# 2. Navigate to project root
cd c:\1_PersonalProjects\ExpenseMate

# 3. Run the script
.\cleanup-unused-features.ps1

# If you get execution policy error:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\cleanup-unused-features.ps1
```

## Option 3: Git-Based Cleanup (Safest)

Use Git to track and verify changes:

```powershell
# Create a new branch for cleanup
git checkout -b cleanup-unused-features

# Remove files using git (better for tracking)
git rm "app\(tabs)\my-day.tsx"
git rm "app\Chat.tsx"
git rm "app\Calculator.tsx"
git rm "app\CalculatorInfo.tsx"
git rm "utils\dayMemoryService.ts"
git rm "utils\dayMemoryReminderService.ts"
git rm "utils\calculatorUtils.ts"
git rm "types\DailyMemory.ts"
git rm "components\DailyMemoryReminderAgent.tsx"
git rm "components\DailyMemorySyncAgent.tsx"

# Optional: Remove investment files
git rm "app\Investments.tsx"
git rm "contexts\InvestmentContext.tsx"
git rm "utils\investmentService.ts"
git rm "types\Investment.ts"
git rm "domain\Investment.ts"
git rm "components\InvestmentManagerScreen.tsx"
git rm "INVESTMENTS_FEATURE.md"

# Review changes
git status
git diff --cached

# Commit if everything looks good
git commit -m "Remove unused features (My Day, Chat, Calculator, Investments)"

# Test the app
npm install
npx expo start --clear

# If everything works, merge to main
git checkout main
git merge cleanup-unused-features

# If something went wrong, revert
git checkout main
git branch -D cleanup-unused-features
```

## Post-Cleanup Checklist

After removing files:

### 1. Update Imports
- [ ] Check `app\_layout.tsx` for removed providers
- [ ] Check for any remaining imports of deleted files
- [ ] Update TypeScript config if needed

### 2. Test Core Functionality
- [ ] Add expense
- [ ] View analytics
- [ ] Export data (CSV & Summary)
- [ ] Set goals
- [ ] View profile
- [ ] Dark/Light mode switch

### 3. Clean Build
```powershell
# Clear cache and rebuild
npx expo start --clear

# Or more thorough:
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path ".expo" -Recurse -Force
npm install
npx expo start --clear
```

### 4. Update Documentation
- [ ] Update README if it mentions removed features
- [ ] Update screenshots if needed
- [ ] Update feature list

### 5. Verify Git Status
```powershell
git status
git log --oneline -5
```

## Troubleshooting

### "Cannot find module" Errors
1. Search entire codebase for imports of deleted files:
   ```powershell
   Get-ChildItem -Recurse -Include *.tsx,*.ts | Select-String -Pattern "dayMemoryService|Chat\.tsx|Calculator"
   ```
2. Remove or update those imports

### App Crashes After Cleanup
1. Check console for error messages
2. Clear cache: `npx expo start --clear`
3. Verify all required files are still present
4. Check `app\_layout.tsx` for removed providers

### TypeScript Errors
1. Run: `npx tsc --noEmit` to find all type errors
2. Check for references to deleted types
3. Update or remove those references

## Rollback Instructions

If something goes wrong:

### Using Git (Recommended)
```powershell
# If you haven't committed yet
git checkout -- .
git clean -fd

# If you've committed
git log --oneline
git revert <commit-hash>

# Or reset to before cleanup
git reset --hard HEAD~1
```

### Manual Rollback
If you have a backup:
```powershell
# Restore from backup
Copy-Item -Path "C:\Backup\ExpenseMate\*" -Destination "c:\1_PersonalProjects\ExpenseMate\" -Recurse -Force
```

## Verification Commands

After cleanup, run these to verify:

```powershell
# Check file structure
Get-ChildItem -Recurse -Name | Select-String -Pattern "app\\|components\\|utils\\" | Sort-Object

# Check for remaining references to removed features
Get-ChildItem -Recurse -Include *.tsx,*.ts | Select-String -Pattern "dayMemory|Chat|Calculator" | Where-Object { $_.Path -notmatch "node_modules" }

# Check TypeScript
npx tsc --noEmit

# Check for linting issues
npm run lint
```

## Summary

This cleanup removes:
- ✅ ~2000+ lines of unused code
- ✅ 10-15 unused files
- ✅ Feature-specific dependencies
- ✅ Complexity and maintenance burden

Result:
- 🚀 Faster app performance
- 📦 Smaller bundle size
- 🎯 Better focused features
- 🧹 Cleaner codebase

---

**Remember:** Always backup before running cleanup operations!

**Last Updated:** 2026-06-30
