import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/service", label: "서비스" }
];

export function MainNav() {
  return (
    <nav aria-label="메인 내비게이션" className="main-nav">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
      <Link className="nav-cta" href="/service">
        분석 시작
      </Link>
    </nav>
  );
}
