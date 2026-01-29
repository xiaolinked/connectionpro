import SwiftUI

struct ConnectionDetailView: View {
    let connectionId: String
    @State private var viewModel: ConnectionDetailViewModel
    @State private var showingDeleteAlert = false
    @Environment(\.dismiss) private var dismiss

    init(connectionId: String) {
        self.connectionId = connectionId
        _viewModel = State(initialValue: ConnectionDetailViewModel(connectionId: connectionId))
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                LoadingView(message: "Loading connection...")
            } else if let error = viewModel.errorMessage, viewModel.connection == nil {
                EmptyStateView(
                    systemImage: "exclamationmark.triangle",
                    title: "Something went wrong",
                    message: error,
                    actionTitle: "Try Again"
                ) {
                    Task { await viewModel.loadData() }
                }
            } else if let connection = viewModel.connection {
                ScrollView {
                    VStack(spacing: 24) {
                        // Profile header
                        profileHeader(connection)

                        // Metadata grid
                        metadataSection(connection)

                        // Goals section
                        if let goals = connection.goals, !goals.isEmpty {
                            sectionCard(title: "Goals", systemImage: "target") {
                                Text(goals)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // Notes section
                        if let notes = connection.notes, !notes.isEmpty {
                            sectionCard(title: "Notes", systemImage: "note.text") {
                                Text(notes)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // Add interaction form
                        LogFormView(
                            logType: $viewModel.logType,
                            logNotes: $viewModel.logNotes,
                            logTags: $viewModel.logTags,
                            isLoading: viewModel.isAddingLog
                        ) {
                            Task { await viewModel.addLog() }
                        }

                        // Timeline
                        sectionCard(title: "Timeline", systemImage: "clock.arrow.circlepath") {
                            if viewModel.connectionLogs.isEmpty {
                                Text("No interactions logged yet.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: .infinity, alignment: .center)
                                    .padding()
                            } else {
                                LazyVStack(alignment: .leading, spacing: 0) {
                                    ForEach(viewModel.connectionLogs) { log in
                                        TimelineItemView(log: log)

                                        if log.id != viewModel.connectionLogs.last?.id {
                                            Divider()
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding()
                }
                .background(Color.sectionBackground)
            }
        }
        .navigationTitle(viewModel.connection?.name ?? "Connection")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if let connection = viewModel.connection {
                    NavigationLink {
                        EditConnectionView(connection: connection)
                    } label: {
                        Text("Edit")
                    }
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Button(role: .destructive) {
                    showingDeleteAlert = true
                } label: {
                    Image(systemName: "trash")
                }
            }
        }
        .alert("Delete Connection", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    if await viewModel.deleteConnection() {
                        dismiss()
                    }
                }
            }
        } message: {
            Text("Are you sure you want to delete this connection? This action cannot be undone.")
        }
        .task {
            await viewModel.loadData()
        }
    }

    // MARK: - Profile Header

    @ViewBuilder
    private func profileHeader(_ connection: ConnectionRead) -> some View {
        VStack(spacing: 12) {
            AvatarView(name: connection.name, size: 80)

            Text(connection.name)
                .font(.title2)
                .fontWeight(.bold)

            if let role = connection.role, !role.isEmpty {
                Text(role)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            StatusBadgeView(status: getConnectionStatus(connection).status)

            // Tags
            if !connection.tags.isEmpty {
                FlowLayout(spacing: 6) {
                    ForEach(connection.tags, id: \.self) { tag in
                        Text(tag)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color.appPrimary.opacity(0.1))
                            .foregroundStyle(Color.appPrimary)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    // MARK: - Metadata Section

    @ViewBuilder
    private func metadataSection(_ connection: ConnectionRead) -> some View {
        VStack(spacing: 12) {
            if let company = connection.company, !company.isEmpty {
                metadataRow(icon: "building.2.fill", label: "Company", value: company)
            }
            if let email = connection.email, !email.isEmpty {
                metadataRow(icon: "envelope.fill", label: "Email", value: email)
            }
            if let location = connection.location, !location.isEmpty {
                metadataRow(icon: "mappin.circle.fill", label: "Location", value: location)
            }
            if let howMet = connection.howMet, !howMet.isEmpty {
                metadataRow(icon: "hand.wave.fill", label: "How Met", value: howMet)
            }
            if connection.frequency > 0 {
                metadataRow(icon: "calendar.badge.clock", label: "Follow-up", value: "Every \(connection.frequency) days")
            }
            if let lastContact = connection.lastContact {
                metadataRow(icon: "clock.fill", label: "Last Contact", value: lastContact.relativeString())
            }
        }
        .padding()
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private func metadataRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
        }
    }

    // MARK: - Section Card

    @ViewBuilder
    private func sectionCard<Content: View>(title: String, systemImage: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: systemImage)
                .font(.headline)

            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

// Simple flow layout for tags
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(subviews: subviews, proposal: proposal)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(subviews: subviews, proposal: proposal)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), proposal: .unspecified)
        }
    }

    private func layout(subviews: Subviews, proposal: ProposedViewSize) -> (size: CGSize, frames: [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
            lineHeight = max(lineHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + lineHeight), frames)
    }
}

#Preview {
    NavigationStack {
        ConnectionDetailView(connectionId: "1")
    }
}
