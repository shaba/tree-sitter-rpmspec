%global pkgname example

Name:           example
Version:        1.0.0
Release:        %autorelease
Summary:        An example

License:        CC-0
URL:            https://example.org
Source0:        https://example.org/%{name}-%{version}.tar.gz

BuildRequires(pre): rpm-macros-cmake
BuildPreReq:    rpm-macros-systemd
BuildRequires:  make
%ifarch x86_64
Requires:       bash
%endif
Requires(post): systemd

%description
An example spec file


%prep
%autosetup -p1


%build
%configure \
    --prefix=%{_prefix}
%make_build


%install
%make_install


%check
%make_build test

%files
%license LICENSE
%doc README.md
%{_bindir}/example
%config(missingok,noreplace) %verify(not link size mtime md5) %_sysconfdir/%name/%name.conf
%ghost %verify(user group mode) %attr(644,root,root) %_logdir/%name.log

%changelog
%autochangelog
