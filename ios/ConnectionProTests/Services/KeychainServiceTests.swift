import XCTest
@testable import ConnectionPro

final class KeychainServiceTests: XCTestCase {

    let testKey = "com.connectionpro.test.token"

    override func setUp() {
        super.setUp()
        // Clean up any existing test data
        KeychainService.shared.deleteToken()
    }

    override func tearDown() {
        // Clean up after tests
        KeychainService.shared.deleteToken()
        super.tearDown()
    }

    func testSaveAndGetToken() {
        let testToken = "test-jwt-token-12345"

        // Save token
        KeychainService.shared.saveToken(testToken)

        // Retrieve token
        let retrieved = KeychainService.shared.getToken()

        XCTAssertEqual(retrieved, testToken)
    }

    func testGetToken_whenNoTokenSaved_returnsNil() {
        let retrieved = KeychainService.shared.getToken()

        XCTAssertNil(retrieved)
    }

    func testDeleteToken() {
        let testToken = "token-to-delete"

        // Save then delete
        KeychainService.shared.saveToken(testToken)
        KeychainService.shared.deleteToken()

        // Should be nil
        let retrieved = KeychainService.shared.getToken()
        XCTAssertNil(retrieved)
    }

    func testOverwriteToken() {
        let token1 = "first-token"
        let token2 = "second-token"

        KeychainService.shared.saveToken(token1)
        KeychainService.shared.saveToken(token2)

        let retrieved = KeychainService.shared.getToken()
        XCTAssertEqual(retrieved, token2)
    }
}
