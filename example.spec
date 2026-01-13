%global pkgname example
%def_enable docs
%def_disable static

Name:           example
Version:        1.0.0
Release:        %autorelease
Summary:        An example

License:        CC-0
URL:            https://example.org
Source0:        https://example.org/%{name}-%{version}.tar.gz
Patch1:         %{name}-1.0.0.patch

BuildRequires(pre): rpm-macros-cmake
BuildPreReq:    rpm-macros-systemd
BuildRequires:  make
BuildRequires:  pkgconfig(zlib)
%{?_enable_docs:BuildRequires: doxygen /usr/bin/sphinx-build python3-module-sphinx_rtd_theme}

%ifarch x86_64
Requires:       bash
%endif
Requires(post): systemd

%description
An example spec file

%package devel
Summary: Example development files
Group: Development/C
Provides: lib%name-devel = %EVR
Requires: %name = %EVR
Requires: pkgconfig(zlib)

%description devel
%summary.

%package doc
Summary: Example documentation
Group: Development/Documentation
BuildArch: noarch

%description doc
%summary.

%define docdir %_docdir/%name

%prep
%setup
%patch1 -p1
%autosetup -p1

%build
%add_optflags -fcommon
%configure \
    %{subst_enable static} \
    %{subst_enable docs} \
    --prefix=%{_prefix}
%make_build

%meson \
    %{?_enable_docs:-Denable_docs=true} \
    -Dmachine=default
%meson_build

%install
%make_install
rm -f %buildroot%_libdir/*.{a,la}

%check
%make_build test

%files
%license LICENSE
%doc README.md
%defattr(0644,root,root,0755)
%{_bindir}/*
%exclude %{_bindir}/example-test
%config(missingok,noreplace) %verify(not link size mtime md5) %_sysconfdir/%name/%name.conf
%config %_sysconfdir/sysconfig/%name
%ghost %verify(user group mode) %attr(644,root,root) %_logdir/%name.log

%files devel
%_includedir/%name
%_pkgconfigdir/%name.pc

%if_enabled docs
%files doc
%docdir/%name
%endif

%changelog
%autochangelog
