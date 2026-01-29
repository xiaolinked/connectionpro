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
}
