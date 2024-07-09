"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const BreadCrumb = ({ title }) => {
  const pathname = usePathname();

  return (
    <div className="breadCrumb">
      <div className="breadCrumb__path">
        <Link href={pathname} className="breadcrumb__link">
          <span>app{pathname}</span>
        </Link>
      </div>
      <h2 id="breadCrumb__title">{title}</h2>
    </div>
  );
};

export default BreadCrumb;
