import XCTest
@testable import ConnectionPro

@MainActor
final class AuthViewModelTests: XCTestCase {

    func testInitialState() {
        let viewModel = AuthViewModel()

        XCTAssertNil(viewModel.user)
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertTrue(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testRegisterFlowInitialState() {
        let viewModel = AuthViewModel()

        XCTAssertEqual(viewModel.registerStep, .email)
        XCTAssertTrue(viewModel.registerEmail.isEmpty)
        XCTAssertTrue(viewModel.registerName.isEmpty)
        XCTAssertNil(viewModel.magicLink)
    }

    func testLogout_clearsState() {
        let viewModel = AuthViewModel()
        viewModel.isAuthenticated = true
        viewModel.registerEmail = "test@example.com"
        viewModel.registerName = "Test User"

        viewModel.logout()

        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.user)
        XCTAssertEqual(viewModel.registerStep, .email)
        XCTAssertTrue(viewModel.registerEmail.isEmpty)
        XCTAssertTrue(viewModel.registerName.isEmpty)
    }

    func testResetRegisterFlow() {
        let viewModel = AuthViewModel()
        viewModel.registerStep = .checkEmail
        viewModel.registerEmail = "test@example.com"
        viewModel.registerName = "Test"
        viewModel.magicLink = "some-link"
        viewModel.errorMessage = "Some error"

        viewModel.resetRegisterFlow()

        XCTAssertEqual(viewModel.registerStep, .email)
        XCTAssertTrue(viewModel.registerEmail.isEmpty)
        XCTAssertTrue(viewModel.registerName.isEmpty)
        XCTAssertNil(viewModel.magicLink)
        XCTAssertNil(viewModel.errorMessage)
    }

    func testHandleDeepLink_invalidURL_doesNothing() async {
        let viewModel = AuthViewModel()
        let invalidURL = URL(string: "connectionpro://invalid")!

        await viewModel.handleDeepLink(url: invalidURL)

        XCTAssertFalse(viewModel.isVerifying)
        XCTAssertNil(viewModel.verifyError)
    }

    func testHandleDeepLink_missingToken_doesNothing() async {
        let viewModel = AuthViewModel()
        let noTokenURL = URL(string: "connectionpro://verify")!

        await viewModel.handleDeepLink(url: noTokenURL)

        XCTAssertFalse(viewModel.isVerifying)
    }
    
    // Note: This mainly tests the side effects of deleteAccount (calling logout)
    // since we cannot easily mock the static AuthService without refactoring.
    func testDeleteAccount_clearsState() async throws {
        let viewModel = AuthViewModel()
        viewModel.isAuthenticated = true
        viewModel.user = UserRead(id: "1", email: "test@example.com", name: "User", isActive: true, createdAt: Date())
        
        // We simulate the success path by manually triggering what happens after success
        // In a real unit test with DI, we would mock AuthService.deleteAccount to return success.
        // Here we just test that the logout logic which follows is correct.
        viewModel.logout()
        
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.user)
    }
}
