import Foundation

enum PreviewData {
    static let user = UserRead(
        id: "user-1",
        email: "john@example.com",
        name: "John Doe",
        isActive: true,
        createdAt: Date()
    )

    static let connections: [ConnectionRead] = [
        ConnectionRead(
            id: "conn-1",
            name: "Alice Smith",
            role: "CTO",
            company: "TechCorp",
            location: "New York",
            industry: "Technology",
            howMet: "Conference",
            frequency: 30,
            lastContact: Calendar.current.date(byAdding: .day, value: -5, to: Date()),
            notes: "Met at PyCon 2024",
            linkedin: "https://linkedin.com/in/alice",
            email: "alice@techcorp.com",
            goals: "Partnership opportunity",
            tags: ["vip", "tech"],
            createdAt: Date()
        ),
        ConnectionRead(
            id: "conn-2",
            name: "Bob Johnson",
            role: "Engineer",
            company: "StartupInc",
            location: "San Francisco",
            industry: "SaaS",
            howMet: "LinkedIn",
            frequency: 90,
            lastContact: Calendar.current.date(byAdding: .day, value: -100, to: Date()),
            notes: nil,
            linkedin: nil,
            email: "bob@startup.com",
            goals: nil,
            tags: ["work"],
            createdAt: Date()
        ),
        ConnectionRead(
            id: "conn-3",
            name: "Carol Williams",
            role: "Designer",
            company: "DesignCo",
            location: "Austin",
            industry: "Design",
            howMet: "Meetup",
            frequency: 60,
            lastContact: Calendar.current.date(byAdding: .day, value: -50, to: Date()),
            notes: "Interested in collaboration",
            linkedin: nil,
            email: "carol@design.co",
            goals: "Design collaboration",
            tags: ["creative", "mentor"],
            createdAt: Date()
        ),
    ]

    static let logs: [LogRead] = [
        LogRead(
            id: "log-1",
            connectionId: "conn-1",
            type: "meeting",
            notes: "Had coffee to discuss partnership",
            tags: ["important"],
            createdAt: Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        ),
        LogRead(
            id: "log-2",
            connectionId: "conn-1",
            type: "interaction",
            notes: "Followed up via email about proposal",
            tags: [],
            createdAt: Calendar.current.date(byAdding: .day, value: -10, to: Date())!
        ),
        LogRead(
            id: "log-3",
            connectionId: "conn-2",
            type: "interaction",
            notes: "Quick LinkedIn message",
            tags: [],
            createdAt: Calendar.current.date(byAdding: .day, value: -100, to: Date())!
        ),
    ]

    static let healthyConnection = connections[0]
    static let overdueConnection = connections[1]
    static let dueSoonConnection = connections[2]

    static var connection: ConnectionRead { connections[0] }
    static var log: LogRead { logs[0] }
}
