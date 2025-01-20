# Contributing to ShopSync AI

## Code of Conduct
Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs
1. Check if the bug is already reported in [Issues](https://github.com/your-org/shopsync-ai/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - System information

### Suggesting Enhancements
1. Check existing [Enhancement Proposals](https://github.com/your-org/shopsync-ai/labels/enhancement)
2. Create a new issue using the feature request template
3. Provide:
   - Clear use case
   - Expected benefits
   - Possible implementation approach

### Pull Requests
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit pull request

## Development Process

### Branch Naming
- feature/feature-name
- bugfix/bug-description
- hotfix/issue-description
- release/version-number

### Commit Messages
Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```
Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

### Code Style
- Follow existing code style
- Use ESLint configuration
- Run prettier before committing
- Add JSDoc comments for functions

### Testing
- Write unit tests for new features
- Update existing tests as needed
- Maintain test coverage
- Add integration tests for API changes

## Review Process

### Before Submitting
- [ ] Run all tests
- [ ] Update documentation
- [ ] Add test cases
- [ ] Follow code style
- [ ] Update changelog

### Code Review
1. Two approvals required
2. Address review comments
3. Update PR as needed
4. Squash commits before merge

## Documentation

### API Documentation
- Update API docs for changes
- Include request/response examples
- Document new endpoints
- Update OpenAPI spec

### Code Documentation
- Add JSDoc comments
- Update README if needed
- Document complex logic
- Add inline comments

## Release Process

### Version Numbers
Follow semantic versioning:
- MAJOR.MINOR.PATCH
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Release Steps
1. Update version number
2. Update changelog
3. Create release branch
4. Run final tests
5. Create GitHub release
6. Deploy to production

## Getting Help
- Join our [Discord](https://discord.gg/shopsync)
- Check [Documentation](./docs)
- Ask in GitHub discussions
- Email: support@shopsync.ai
