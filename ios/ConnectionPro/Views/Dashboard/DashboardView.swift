import SwiftUI

struct DashboardView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var viewModel = DashboardViewModel()

    private var firstName: String {
        authViewModel.user?.name.split(separator: " ").first.map(String.init) ?? "there"
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                LoadingView(message: "Loading your network...")
            } else if let error = viewModel.errorMessage {
                EmptyStateView(
                    systemImage: "exclamationmark.triangle",
                    title: "Something went wrong",
                    message: error,
                    actionTitle: "Try Again"
                ) {
                    Task { await viewModel.loadData() }
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Greeting
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome, \(firstName)!")
                                .font(.largeTitle)
                                .fontWeight(.bold)

                            Text("Here is your professional network overview.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }

                        // Smart Reminders
                        SmartRemindersView(reminders: viewModel.smartReminders)

                        // Stats Grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            StatCardView(
                                title: "Total Connections",
                                value: viewModel.totalConnections,
                                systemImage: "person.2.fill",
                                color: .blue
                            )

                            StatCardView(
                                title: "Upcoming Follow-ups",
                                value: viewModel.upcomingFollowUps,
                                systemImage: "calendar",
                                color: .orange
                            )

                            StatCardView(
                                title: "Growth Moments",
                                value: viewModel.growthMoments,
                                systemImage: "chart.line.uptrend.xyaxis",
                                color: .green
                            )
                        }

                        // Recent Interactions
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Interactions")
                                .font(.headline)

                            if viewModel.recentLogs.isEmpty {
                                VStack(spacing: 8) {
                                    Text("No interactions logged yet.")
                                        .foregroundStyle(.secondary)

                                    Text("Start by adding a connection and logging a chat!")
                                        .font(.caption)
                                        .foregroundStyle(.tertiary)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                            } else {
                                ForEach(viewModel.recentLogs) { log in
                                    HStack(alignment: .top, spacing: 12) {
                                        Image(systemName: logTypeIcon(log.type))
                                            .foregroundStyle(.secondary)
                                            .frame(width: 20)

                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(log.notes.isEmpty ? "No notes" : log.notes)
                                                .font(.subheadline)
                                                .lineLimit(2)

                                            Text(log.createdAt.relativeString())
                                                .font(.caption)
                                                .foregroundStyle(.tertiary)
                                        }

                                        Spacer()
                                    }
                                    .padding(.vertical, 8)

                                    if log.id != viewModel.recentLogs.last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                        .padding()
                        .background(Color.cardBackground)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding()
                }
                .background(Color.sectionBackground)
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .navigationTitle("Dashboard")
        .navigationDestination(for: ConnectionRead.self) { connection in
            ConnectionDetailView(connectionId: connection.id)
        }
        .task {
            await viewModel.loadData()
        }
    }

    private func logTypeIcon(_ type: String) -> String {
        switch type {
        case "call": return "phone.fill"
        case "email": return "envelope.fill"
        case "meeting": return "person.2.fill"
        case "social": return "bubble.left.fill"
        default: return "text.bubble.fill"
        }
    }
}

#Preview {
    NavigationStack {
        DashboardView()
    }
    .environment(AuthViewModel())
}
