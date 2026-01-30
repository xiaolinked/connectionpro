import XCTest
@testable import ConnectionPro

@MainActor
final class SettingsViewModelTests: XCTestCase {
    
    var authViewModel: AuthViewModel!
    var viewModel: SettingsViewModel!
    
    override func setUp() async throws {
        authViewModel = AuthViewModel()
        // Simulate logged in user
        authViewModel.user = User(id: "u1", email: "test@example.com", name: "Test User", isActive: true, createdAt: Date())
        authViewModel.isAuthenticated = true
        
        viewModel = SettingsViewModel(authViewModel: authViewModel)
    }
    
    func testInitialState() {
        XCTAssertEqual(viewModel.name, "Test User")
        XCTAssertEqual(viewModel.email, "test@example.com")
        XCTAssertFalse(viewModel.hasChanges)
        XCTAssertFalse(viewModel.isSaving)
    }
    
    func testUpdateName_enablesSave() {
        viewModel.name = "New Name"
        XCTAssertTrue(viewModel.hasChanges)
    }
    
    // Note: detailed save/delete tests might require mocking APIClient, 
    // which is static in the current codebase. Integration tests or refactoring 
    // to dependency injection would be needed for full coverage.
    // For now, we test the ViewModel logic assuming happy path or mock if possible.
}
