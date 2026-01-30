import SwiftUI

struct ConnectionListView: View {
    @State private var viewModel = ConnectionListViewModel()
    @State private var showingBulkImport = false
    @State private var showingNewConnection = false

    var body: some View {
        Group {
            if viewModel.isLoading {
                LoadingView(message: "Loading connections...")
            } else if let error = viewModel.errorMessage, viewModel.connections.isEmpty {
                EmptyStateView(
                    systemImage: "exclamationmark.triangle",
                    title: "Something went wrong",
                    message: error,
                    actionTitle: "Try Again"
                ) {
                    Task { await viewModel.loadConnections() }
                }
            } else if viewModel.connections.isEmpty {
                EmptyStateView(
                    systemImage: "person.2.slash",
                    title: "No Connections",
                    message: "Start building your network by adding your first connection."
                )
            } else {
                List {
                    ForEach(viewModel.filteredConnections) { connection in
                        NavigationLink(value: connection) {
                            ConnectionRowView(connection: connection)
                        }
                    }
                    .onDelete { indexSet in
                        Task {
                            for index in indexSet {
                                let connection = viewModel.filteredConnections[index]
                                await viewModel.deleteConnection(connection)
                            }
                            HapticService.success()
                            ToastManager.shared.show("Connection deleted", type: .info, withHaptic: false)
                        }
                    }
                }
                .listStyle(.plain)
                .searchable(text: $viewModel.searchText, prompt: "Search connections...")
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .navigationTitle("My Network")
        .navigationDestination(for: ConnectionRead.self) { connection in
            ConnectionDetailView(connectionId: connection.id)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Picker("Sort By", selection: $viewModel.sortKey) {
                        ForEach(ConnectionSortKey.allCases, id: \.self) { key in
                            Text(key.rawValue).tag(key)
                        }
                    }

                    Divider()

                    Button {
                        viewModel.toggleSortDirection()
                    } label: {
                        Label(
                            viewModel.sortAscending ? "Ascending" : "Descending",
                            systemImage: viewModel.sortAscending ? "arrow.up" : "arrow.down"
                        )
                    }
                } label: {
                    Image(systemName: "arrow.up.arrow.down")
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        showingNewConnection = true
                    } label: {
                        Label("Add Manually", systemImage: "square.and.pencil")
                    }

                    Button {
                        showingBulkImport = true
                    } label: {
                        Label("Import from Contacts", systemImage: "person.crop.circle.badge.plus")
                    }
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .navigationDestination(isPresented: $showingNewConnection) {
            NewConnectionView()
        }
        .sheet(isPresented: $showingBulkImport) {
            ContactPickerView { (_: [PhonebookContact]) in
                // Refresh the list after import
                Task { await viewModel.loadConnections() }
            }
        }
        .task {
            await viewModel.loadConnections()
        }
        .toastOverlay()
    }
}

#Preview {
    NavigationStack {
        ConnectionListView()
    }
}
