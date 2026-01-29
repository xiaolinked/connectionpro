import XCTest
@testable import ConnectionPro

@MainActor
final class ConnectionListViewModelTests: XCTestCase {

    func testInitialState() {
        let viewModel = ConnectionListViewModel()

        XCTAssertTrue(viewModel.connections.isEmpty)
        XCTAssertTrue(viewModel.searchText.isEmpty)
        XCTAssertEqual(viewModel.sortKey, .name)
        XCTAssertTrue(viewModel.sortAscending)
        XCTAssertTrue(viewModel.isLoading)
    }

    func testFilteredConnections_noSearch_returnsAll() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.searchText = ""

        XCTAssertEqual(viewModel.filteredConnections.count, 3)
    }

    func testFilteredConnections_searchByName() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.searchText = "alice"

        XCTAssertEqual(viewModel.filteredConnections.count, 1)
        XCTAssertEqual(viewModel.filteredConnections.first?.name, "Alice Smith")
    }

    func testFilteredConnections_searchByCompany() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.searchText = "techcorp"

        XCTAssertEqual(viewModel.filteredConnections.count, 1)
        XCTAssertEqual(viewModel.filteredConnections.first?.company, "TechCorp")
    }

    func testFilteredConnections_searchByTag() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.searchText = "mentor"

        XCTAssertEqual(viewModel.filteredConnections.count, 1)
        XCTAssertEqual(viewModel.filteredConnections.first?.name, "Carol Williams")
    }

    func testSortByName_ascending() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.sortKey = .name
        viewModel.sortAscending = true

        let names = viewModel.filteredConnections.map { $0.name }
        XCTAssertEqual(names, ["Alice Smith", "Bob Johnson", "Carol Williams"])
    }

    func testSortByName_descending() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.sortKey = .name
        viewModel.sortAscending = false

        let names = viewModel.filteredConnections.map { $0.name }
        XCTAssertEqual(names, ["Carol Williams", "Bob Johnson", "Alice Smith"])
    }

    func testSortByCompany() {
        let viewModel = ConnectionListViewModel()
        viewModel.connections = makeTestConnections()
        viewModel.sortKey = .company
        viewModel.sortAscending = true

        let companies = viewModel.filteredConnections.compactMap { $0.company }
        XCTAssertEqual(companies, ["DesignCo", "StartupInc", "TechCorp"])
    }

    func testToggleSortDirection() {
        let viewModel = ConnectionListViewModel()
        XCTAssertTrue(viewModel.sortAscending)

        viewModel.toggleSortDirection()
        XCTAssertFalse(viewModel.sortAscending)

        viewModel.toggleSortDirection()
        XCTAssertTrue(viewModel.sortAscending)
    }

    // MARK: - Helpers

    private func makeTestConnections() -> [ConnectionRead] {
        [
            ConnectionRead(
                id: "1",
                name: "Alice Smith",
                role: "CTO",
                company: "TechCorp",
                location: nil,
                industry: nil,
                howMet: nil,
                frequency: 30,
                lastContact: nil,
                notes: nil,
                linkedin: nil,
                email: nil,
                goals: nil,
                tags: ["vip"],
                createdAt: Date()
            ),
            ConnectionRead(
                id: "2",
                name: "Bob Johnson",
                role: nil,
                company: "StartupInc",
                location: nil,
                industry: nil,
                howMet: nil,
                frequency: 90,
                lastContact: nil,
                notes: nil,
                linkedin: nil,
                email: nil,
                goals: nil,
                tags: [],
                createdAt: Date()
            ),
            ConnectionRead(
                id: "3",
                name: "Carol Williams",
                role: nil,
                company: "DesignCo",
                location: nil,
                industry: nil,
                howMet: nil,
                frequency: 60,
                lastContact: nil,
                notes: nil,
                linkedin: nil,
                email: nil,
                goals: nil,
                tags: ["mentor"],
                createdAt: Date()
            ),
        ]
    }
}
