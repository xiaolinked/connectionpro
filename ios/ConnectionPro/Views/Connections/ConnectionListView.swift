import SwiftUI

struct ConnectionListView: View {
    @State private var viewModel = ConnectionListViewModel()

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
                NavigationLink {
                    NewConnectionView()
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .task {
            await viewModel.loadConnections()
        }
    }
}

#Preview {
    NavigationStack {
        ConnectionListView()
    }
}
