# Focused Documentation System - /sc:document

## 🎯 Purpose

The `/sc:document` command provides precise, targeted documentation for specific components, functions, or features within the task-master-init project. This system generates focused documentation that integrates seamlessly with the existing comprehensive documentation ecosystem.

## 📋 Usage Patterns

### Basic Usage
```bash
/sc:document [target] [--type inline|external|api|guide] [--style brief|detailed]
```

### Advanced Usage
```bash
/sc:document pack-list/src/store/usePackListStore.ts --type api --style detailed
/sc:document pack-list/src/lib/performance.ts --type inline --style brief
/sc:document "Task Master CLI Commands" --type guide --style detailed
```

## 🔧 Documentation Types

### 1. Inline Documentation (`--type inline`)
- **Purpose**: Add or enhance JSDoc comments and inline documentation
- **Target**: Functions, classes, interfaces, complex logic
- **Output**: Enhanced source code with comprehensive comments
- **Integration**: Updates existing files with improved documentation

### 2. External Documentation (`--type external`)
- **Purpose**: Create standalone documentation files
- **Target**: Components, modules, features, workflows
- **Output**: Dedicated `.md` files with comprehensive coverage
- **Integration**: Links to main documentation system

### 3. API Documentation (`--type api`)
- **Purpose**: Generate detailed API reference documentation
- **Target**: Public interfaces, store methods, hooks, utilities
- **Output**: Structured API documentation with examples
- **Integration**: Updates API_REFERENCE.md or creates focused API docs

### 4. Guide Documentation (`--type guide`)
- **Purpose**: Create step-by-step guides and tutorials
- **Target**: Workflows, setup processes, complex features
- **Output**: Tutorial-style documentation with examples
- **Integration**: Adds to knowledge base with cross-references

## 🎨 Documentation Styles

### Brief Style (`--style brief`)
- Concise descriptions and essential information
- Key parameters and return values
- Basic usage examples
- Quick reference format

### Detailed Style (`--style detailed`)
- Comprehensive descriptions with context
- All parameters, return values, and edge cases
- Multiple usage examples and scenarios
- Integration points and related components
- Performance considerations and best practices

## 📁 Target Examples

### Component Targets
```bash
# React Components
/sc:document pack-list/src/components/lists/list-detail.tsx --type external --style detailed

# Store Components
/sc:document pack-list/src/store/usePackListStore.ts --type api --style detailed

# Utility Functions
/sc:document pack-list/src/lib/performance.ts --type inline --style brief

# Custom Hooks
/sc:document pack-list/src/hooks/use-optimized-store.ts --type api --style detailed
```

### Feature Targets
```bash
# Task Master Features
/sc:document "MCP Server Integration" --type guide --style detailed
/sc:document "AI Model Management" --type external --style detailed

# Pack List Features
/sc:document "Template System" --type guide --style detailed
/sc:document "Progress Tracking" --type external --style brief
```

### System Targets
```bash
# Configuration
/sc:document .taskmaster/config.json --type guide --style brief
/sc:document pack-list/components.json --type external --style brief

# Workflows
/sc:document "Claude Code Integration Workflow" --type guide --style detailed
/sc:document "Development Setup Process" --type guide --style brief
```

## 🔄 Execution Process

### 1. Target Analysis
- **File Analysis**: Read and parse target files for structure and complexity
- **Context Gathering**: Understand relationships and dependencies
- **Audience Identification**: Determine documentation audience and requirements
- **Existing Documentation Review**: Check for existing documentation to enhance or reference

### 2. Content Generation
- **Structure Planning**: Organize information based on type and style
- **Content Creation**: Generate appropriate documentation content
- **Example Generation**: Create relevant code examples and usage scenarios
- **Cross-Reference Integration**: Link to related documentation and components

### 3. Quality Assurance
- **Accuracy Verification**: Ensure technical accuracy of all information
- **Consistency Check**: Maintain consistency with existing documentation standards
- **Completeness Review**: Verify all essential information is covered
- **Integration Testing**: Ensure proper integration with documentation ecosystem

### 4. Output and Integration
- **File Creation/Update**: Create new files or update existing ones
- **Index Updates**: Update documentation indexes and navigation
- **Cross-Reference Updates**: Add links to related documentation
- **Validation**: Verify all links and references work correctly

## 📊 Documentation Templates

### API Documentation Template
```markdown
# [Component Name] API Reference

## Overview
Brief description of the component's purpose and role.

## Interface
```typescript
interface ComponentInterface {
  // Type definitions
}
```

## Methods/Properties
### methodName(parameters)
- **Description**: What this method does
- **Parameters**: Parameter details with types
- **Returns**: Return value description
- **Example**: Usage example
- **Related**: Links to related methods/components

## Usage Examples
### Basic Usage
### Advanced Usage
### Integration Examples

## Performance Considerations
## Error Handling
## Related Components
```

### Guide Documentation Template
```markdown
# [Feature/Process] Guide

## Overview
What this guide covers and who it's for.

## Prerequisites
What you need before starting.

## Step-by-Step Instructions
### Step 1: [Action]
### Step 2: [Action]
### Step 3: [Action]

## Examples
### Example 1: [Scenario]
### Example 2: [Scenario]

## Troubleshooting
Common issues and solutions.

## Next Steps
What to do after completing this guide.

## Related Resources
Links to related documentation.
```

## 🔗 Integration Points

### With Existing Documentation
- **Knowledge Base**: Links added to KNOWLEDGE_BASE.md
- **API Reference**: Updates to .taskmaster/docs/API_REFERENCE.md
- **Feature Implementations**: Cross-references in FEATURE_IMPLEMENTATIONS.md
- **Code Patterns**: Integration with CODE_PATTERNS.md examples

### With Development Workflow
- **Claude Code**: Accessible via slash commands
- **MCP Integration**: Available through Task Master MCP server
- **File Watching**: Automatic updates when source files change
- **Version Control**: Proper git integration for documentation updates

## 🎯 Best Practices

### Documentation Standards
- Use consistent formatting and structure
- Include practical examples for all documented features
- Maintain up-to-date cross-references
- Follow established naming conventions
- Ensure accessibility and readability

### Content Quality
- Focus on user needs and common use cases
- Provide context and rationale for design decisions
- Include performance and security considerations
- Offer troubleshooting information
- Maintain technical accuracy

### Maintenance
- Update documentation when code changes
- Review and refresh examples regularly
- Validate links and references
- Gather feedback and improve based on usage
- Archive outdated documentation appropriately

---

## 🚀 Ready to Use

The focused documentation system is now ready to generate precise, targeted documentation for any component or feature in the task-master-init project. Use the `/sc:document` command with appropriate targets and options to create exactly the documentation you need.

*This system integrates seamlessly with the existing comprehensive documentation ecosystem while providing focused, actionable documentation for specific development needs.*
