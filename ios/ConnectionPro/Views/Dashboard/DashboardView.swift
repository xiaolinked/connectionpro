import SwiftUI

struct DashboardView: View {
    @Environment(AuthViewModel.self) private var authViewModel
    @State private var viewModel = DashboardViewModel()

    private var firstName: String {
        authViewModel.user?.name.split(separator: " ").first.map(String.init) ?? "there"
    }

    var body: some View {
            VStack(spacing: 0) {
                // MARK: - Premium Header
                ZStack(alignment: .bottomLeading) {
                    Color.brandGradient
                        .ignoresSafeArea()
                    
                    VStack(alignment: .leading, spacing: 16) {
                        HStack {
                            Image(systemName: "network")
                                .font(.title3)
                                .fontWeight(.semibold)
                            Text("Kithly")
                                .font(.headline)
                                .fontWeight(.bold)
                            Spacer()
                            
                            // Profile Avatar
                            AvatarView(name: firstName, size: 32)
                                .overlay(
                                    Circle().stroke(.white.opacity(0.3), lineWidth: 1)
                                )
                        }
                        .foregroundStyle(.white.opacity(0.9))
                        
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Good Morning,")
                                .font(.title3)
                                .fontWeight(.medium)
                                .foregroundStyle(.white.opacity(0.8))
                            
                            Text(firstName)
                                .font(.system(size: 34, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                    .padding(.top, 10)
                }
                .frame(height: 200) // Fixed height for header area
                
                // MARK: - Main Content Area
                ZStack {
                    Color.sectionBackground.ignoresSafeArea()
                    
                    if viewModel.isLoading {
                        LoadingView(message: "Syncing network...")
                            .padding(.top, 40)
                    } else if let error = viewModel.errorMessage {
                        EmptyStateView(
                            systemImage: "exclamationmark.triangle",
                            title: "Connection Issue",
                            message: error,
                            actionTitle: "Try Again"
                        ) {
                            Task { await viewModel.loadData() }
                        }
                        .padding(.top, 40)
                    } else {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 24) {
                                // Smart Reminders (shifted up to overlap)
                                if !viewModel.smartReminders.isEmpty {
                                    SmartRemindersView(reminders: viewModel.smartReminders)
                                        .offset(y: -50)
                                        .padding(.bottom, -30)
                                } else {
                                    Spacer().frame(height: 20)
                                }
                                
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
                                VStack(alignment: .leading, spacing: 16) {
                                    HStack {
                                        Text("Recent Interactions")
                                            .font(.headline)
                                            .fontWeight(.bold)
                                        Spacer()
                                    }
                                    
                                    if viewModel.recentLogs.isEmpty {
                                        VStack(spacing: 12) {
                                            Image(systemName: "bubble.left.and.bubble.right")
                                                .font(.largeTitle)
                                                .foregroundStyle(.tertiary)
                                            Text("No interactions yet")
                                                .font(.subheadline)
                                                .foregroundStyle(.secondary)
                                        }
                                        .frame(maxWidth: .infinity)
                                        .padding(32)
                                        .background(Color.cardBackground)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                    } else {
                                        VStack(spacing: 0) {
                                            ForEach(viewModel.recentLogs) { log in
                                                HStack(alignment: .top, spacing: 16) {
                                                    Circle()
                                                        .fill(Color.gray.opacity(0.1))
                                                        .frame(width: 40, height: 40)
                                                        .overlay(
                                                            Image(systemName: logTypeIcon(log.type))
                                                                .foregroundStyle(.secondary)
                                                                .font(.system(size: 14))
                                                        )
                                                    
                                                    VStack(alignment: .leading, spacing: 4) {
                                                        Text(log.notes.isEmpty ? "Interaction" : log.notes)
                                                            .font(.subheadline)
                                                            .fontWeight(.medium)
                                                            .foregroundStyle(.primary)
                                                            .lineLimit(2)
                                                        
                                                        Text(log.createdAt.relativeString())
                                                            .font(.caption)
                                                            .foregroundStyle(.secondary)
                                                    }
                                                    
                                                    Spacer()
                                                }
                                                .padding(16)
                                                
                                                if log.id != viewModel.recentLogs.last?.id {
                                                    Divider().padding(.leading, 72)
                                                }
                                            }
                                        }
                                        .background(Color.cardBackground)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                        .shadow(color: .black.opacity(0.03), radius: 8, x: 0, y: 2)
                                    }
                                }
                            }
                            .padding(.horizontal)
                            .padding(.bottom, 100)
                        }
                        .refreshable {
                            await viewModel.refresh()
                        }
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
