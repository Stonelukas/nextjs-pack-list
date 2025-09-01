# task-master-init - Documentation Index

## 📚 Documentation Structure

This directory contains comprehensive documentation for the task-master-init project. These documents serve as persistent memory for Claude Code and must be referenced and updated with every feature implementation.

### Core Documents

1. **[FEATURE_IMPLEMENTATIONS.md](./FEATURE_IMPLEMENTATIONS.md)**
   - Complete list of implemented features
   - File locations for each feature
   - Integration points and patterns
   - TODO items for missing functionality
   - Keyboard shortcuts reference (if applicable)

2. **[CODE_PATTERNS.md](./CODE_PATTERNS.md)**
   - Reusable code templates
   - Common patterns for this project
   - Testing templates
   - Helper functions

3. **[API_REFERENCE.md](./API_REFERENCE.md)**
   - Application interfaces
   - Service contracts
   - Data structures
   - Configuration schemas
   - Constants and enums

4. **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**
   - Common issues and solutions
   - Integration gotchas
   - Debugging tips
   - Prevention checklists

5. **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   - System architecture overview
   - Layer responsibilities
   - Component relationships
   - Design decisions

---

## 🔄 Update Protocol

**EVERY new feature implementation MUST:**

1. ✅ Update FEATURE_IMPLEMENTATIONS.md with:
   - Feature description
   - File locations
   - Integration points
   - TODO items

2. ✅ Add to CODE_PATTERNS.md if:
   - Pattern is reusable
   - Common operation type
   - Testing pattern

3. ✅ Update API_REFERENCE.md with:
   - New interfaces
   - Service methods
   - Data structures
   - Configuration options

4. ✅ Document in TROUBLESHOOTING.md if:
   - Issues encountered
   - Non-obvious solutions
   - Integration challenges

5. ✅ Update ARCHITECTURE.md if:
   - Structural changes made
   - New components added
   - Design patterns introduced

---

## 🎯 Quick Navigation

### By Task
- **New Feature**: Start with [ARCHITECTURE.md](./ARCHITECTURE.md) → [CODE_PATTERNS.md](./CODE_PATTERNS.md)
- **Bug Fix**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) → [FEATURE_IMPLEMENTATIONS.md](./FEATURE_IMPLEMENTATIONS.md)
- **Refactoring**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) → [API_REFERENCE.md](./API_REFERENCE.md)
- **Testing**: See [CODE_PATTERNS.md](./CODE_PATTERNS.md#testing-patterns)

### By Layer (if applicable)
- **Presentation/UI**: UI components, event handling, user interaction
- **Business/Domain**: Core logic, domain models, business rules
- **Data/Infrastructure**: Storage, external services, system integration
- **Shared/Common**: Utilities, helpers, constants

---

## 📋 Task Master Integration

### Using These Docs with Task Master

1. **When starting a task**: 
   ```bash
   task-master show <id>
   # Then check relevant sections in these docs
   ```

2. **During implementation**:
   ```bash
   task-master update-subtask --id=<id> --prompt="Check FEATURE_IMPLEMENTATIONS.md for similar patterns"
   ```

3. **After completing**:
   ```bash
   # Update all relevant documentation
   # Then mark task complete
   task-master set-status --id=<id> --status=done
   ```

---

## 🔍 Search Keywords

### Common Searches
- **"how to"** → [CODE_PATTERNS.md](./CODE_PATTERNS.md)
- **"error"** → [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **"where is"** → [FEATURE_IMPLEMENTATIONS.md](./FEATURE_IMPLEMENTATIONS.md)
- **"interface"** → [API_REFERENCE.md](./API_REFERENCE.md)
- **"architecture"** → [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 💡 Implementation Reminders

### Before Starting Work
1. Review this INDEX.md
2. Check FEATURE_IMPLEMENTATIONS.md for existing patterns
3. Read ARCHITECTURE.md for design guidelines
4. Look for similar patterns in CODE_PATTERNS.md

### During Implementation
1. Follow patterns from CODE_PATTERNS.md
2. Update documentation as you code
3. Document any issues in TROUBLESHOOTING.md
4. Add TODOs to FEATURE_IMPLEMENTATIONS.md

### After Completing Work
1. Update all affected documentation
2. Add new patterns if discovered
3. Document lessons learned
4. Cross-reference related features

---

## 📝 Documentation Standards

### File Naming
- Use UPPERCASE.md for index/reference docs
- Use snake_case.md for feature-specific docs
- Keep names descriptive but concise

### Content Structure
1. Clear title with purpose
2. Table of contents for long docs
3. Code examples with syntax highlighting
4. File paths as inline code
5. TODO items as checkboxes
6. Cross-references with relative links

### Code Examples
```typescript
// Always include context
// Explain non-obvious parts
// Show both good and bad examples when relevant
```

---

## 🚀 Getting Started (New Session)

When starting a new Claude Code session:

1. **Review**: Start with this INDEX.md
2. **Context**: Check project status in FEATURE_IMPLEMENTATIONS.md
3. **Patterns**: Review CODE_PATTERNS.md for project conventions
4. **Issues**: Check TROUBLESHOOTING.md for known problems
5. **Update**: Keep docs current as you work

---

## 📌 Project-Specific Notes

{{PROJECT_SPECIFIC_NOTES}}

---

*Last Updated: September 01, 2025*
*Generated by Task Master AI Documentation System*
*Always start here when beginning work on task-master-init*