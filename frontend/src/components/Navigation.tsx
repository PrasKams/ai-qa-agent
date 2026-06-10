
type Page = 'chat' | 'test-generator' | 'bug-triage';

interface NavigationProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const navItems: {id: Page; label: string; icon: string }[] =[
        {id: 'chat', label: 'Chat', icon: '💬'},
        {id: 'test-generator', label: 'Test Generator', icon: '📋' },
        {id: 'bug-triage', label: 'Bug Triage', icon: '🐛' }
    ];

    return (
        <nav className="navigation">
        {
            navItems.map(item => (
                <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </button>
            ))
        }
        </nav>
    )

}