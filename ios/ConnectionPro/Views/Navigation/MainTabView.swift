import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label("Dashboard", systemImage: "house.fill")
            }

            NavigationStack {
                ConnectionListView()
            }
            .tabItem {
                Label("Network", systemImage: "person.2.fill")
            }

            NavigationStack {
                QuickAddView()
            }
            .tabItem {
                Label("Add", systemImage: "plus.circle.fill")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
        }
        .tint(.appPrimary)
    }
}

#Preview {
    MainTabView()
        .environment(AuthViewModel())
}
