import XCTest
@testable import ConnectionPro

final class ConnectionStatusTests: XCTestCase {

    // MARK: - Healthy Status Tests

    func testNewConnectionWithNoLastContact_isHealthy() {
        let connection = makeConnection(lastContact: nil, frequency: 30)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .healthy)
        XCTAssertEqual(result.daysDiff, 0)
    }

    func testConnectionContactedRecently_isHealthy() {
        // Contacted 10 days ago with 30 day frequency -> healthy (within 30-14=16 day threshold)
        let connection = makeConnection(lastContact: daysAgo(10), frequency: 30)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .healthy)
        XCTAssertEqual(result.daysDiff, 10)
    }

    // MARK: - Due Soon Status Tests

    func testConnectionDueSoon() {
        // Contacted 20 days ago with 30 day frequency -> due_soon (within 14 days of frequency)
        let connection = makeConnection(lastContact: daysAgo(20), frequency: 30)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .dueSoon)
        XCTAssertEqual(result.daysDiff, 20)
        XCTAssertEqual(result.dueIn, 10) // 30 - 20 = 10 days until due
    }

    func testConnectionDueSoon_edgeCase() {
        // Contacted 17 days ago with 30 day frequency -> due_soon (30-17=13 < 14)
        let connection = makeConnection(lastContact: daysAgo(17), frequency: 30)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .dueSoon)
    }

    // MARK: - Overdue Status Tests

    func testConnectionOverdue() {
        // Contacted 35 days ago with 30 day frequency -> overdue
        let connection = makeConnection(lastContact: daysAgo(35), frequency: 30)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .overdue)
        XCTAssertEqual(result.overdueBy, 5) // 35 - 30 = 5 days overdue
    }

    func testConnectionLongOverdue() {
        // Contacted 100 days ago with 90 day frequency -> overdue
        let connection = makeConnection(lastContact: daysAgo(100), frequency: 90)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .overdue)
        XCTAssertEqual(result.overdueBy, 10)
    }

    // MARK: - Smart Reminder Message Tests

    func testSmartReminderMessage_overdue() {
        let connection = makeConnection(lastContact: daysAgo(35), frequency: 30, name: "Alice")
        let message = getSmartReminderMessage(connection)

        XCTAssertNotNil(message)
        XCTAssertTrue(message!.contains("Alice"))
    }

    func testSmartReminderMessage_longOverdue() {
        // More than 30 days overdue should show "It's been a while"
        let connection = makeConnection(lastContact: daysAgo(100), frequency: 30, name: "Bob")
        let message = getSmartReminderMessage(connection)

        XCTAssertNotNil(message)
        XCTAssertTrue(message!.contains("been a while"))
    }

    func testSmartReminderMessage_dueSoon() {
        let connection = makeConnection(lastContact: daysAgo(20), frequency: 30, name: "Carol")
        let message = getSmartReminderMessage(connection)

        XCTAssertNotNil(message)
        XCTAssertTrue(message!.contains("due in"))
    }

    func testSmartReminderMessage_healthy_returnsNil() {
        let connection = makeConnection(lastContact: daysAgo(5), frequency: 30, name: "Dave")
        let message = getSmartReminderMessage(connection)

        XCTAssertNil(message)
    }

    // MARK: - Edge Cases

    func testDefaultFrequency_whenZero() {
        // Frequency of 0 should default to 90
        let connection = makeConnection(lastContact: daysAgo(95), frequency: 0)
        let result = getConnectionStatus(connection)

        XCTAssertEqual(result.status, .overdue)
        XCTAssertEqual(result.overdueBy, 5) // 95 - 90 default = 5
    }

    // MARK: - Helpers

    private func makeConnection(lastContact: Date?, frequency: Int, name: String = "Test") -> ConnectionRead {
        ConnectionRead(
            id: "test-id",
            name: name,
            role: nil,
            company: nil,
            location: nil,
            industry: nil,
            howMet: nil,
            frequency: frequency,
            lastContact: lastContact,
            notes: nil,
            linkedin: nil,
            email: nil,
            goals: nil,
            tags: [],
            createdAt: Date()
        )
    }

    private func daysAgo(_ days: Int) -> Date {
        Calendar.current.date(byAdding: .day, value: -days, to: Date())!
    }
}
