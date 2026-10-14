import { useEffect, useMemo, useState } from 'react';

const emptyForm = { name: '', age: '', course: '' };

async function request(path, options) {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Something went wrong. Please try again.');
  }
  if (!contentType.includes('application/json')) {
    throw new Error('The server returned an unexpected response.');
  }
  return payload;
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All courses');
  const [dialogStudent, setDialogStudent] = useState(undefined);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadStudents() {
    setLoading(true);
    setLoadError('');
    try {
      setStudents(await request('/students'));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const courses = useMemo(
    () => [...new Set(students.map((student) => student.course).filter(Boolean))].sort(),
    [students]
  );

  const visibleStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesCourse = courseFilter === 'All courses' || student.course === courseFilter;
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.course.toLowerCase().includes(query) ||
        String(student.age).includes(query);
      return matchesCourse && matchesSearch;
    });
  }, [students, search, courseFilter]);

  const averageAge = students.length
    ? (students.reduce((sum, student) => sum + Number(student.age || 0), 0) / students.length).toFixed(1)
    : '—';

  function openCreateDialog() {
    setDialogStudent(null);
    setForm(emptyForm);
    setFormError('');
  }

  function openEditDialog(student) {
    setDialogStudent(student);
    setForm({ name: student.name, age: String(student.age), course: student.course });
    setFormError('');
  }

  async function saveStudent(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const body = { name: form.name.trim(), age: Number(form.age), course: form.course.trim() };
      if (dialogStudent) {
        const updated = await request(`/students/${dialogStudent._id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        setStudents((current) => current.map((student) => student._id === updated._id ? updated : student));
        setNotice('Student details updated.');
      } else {
        const created = await request('/students', { method: 'POST', body: JSON.stringify(body) });
        setStudents((current) => [created, ...current]);
        setNotice('Student added to the directory.');
      }
      setDialogStudent(undefined);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student) {
    if (!window.confirm(`Remove ${student.name} from the student directory?`)) return;
    try {
      await request(`/students/${student._id}`, { method: 'DELETE' });
      setStudents((current) => current.filter((item) => item._id !== student._id));
      setNotice(`${student.name} was removed.`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const isDialogOpen = dialogStudent !== undefined;
  const isEditing = Boolean(dialogStudent);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Campusly home">
          <span className="brand-mark">c</span>
          <span>campusly</span>
        </a>
        <div className="nav-label">Workspace</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-item active" href="#students"><span className="nav-icon">▦</span> Overview</a>
          <a className="nav-item" href="#students"><span className="nav-icon">♙</span> Students</a>
          <a className="nav-item" href="#courses"><span className="nav-icon">▤</span> Courses</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">✦</div>
            <strong>Need a hand?</strong>
            <p>Your student directory is always just a click away.</p>
          </div>
          <div className="profile">
            <div className="profile-avatar">A</div>
            <div><strong>Admin</strong><span>Administrator</span></div>
            <span className="profile-more">···</span>
          </div>
        </div>
      </aside>

      <main className="main-content" id="students">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Overview</strong></div>
          <div className="topbar-right">
            <span className="today-label">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date())}</span>
            <div className="top-avatar" aria-label="Administrator">A</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">YOUR CAMPUS AT A GLANCE</div>
              <h1>Student overview</h1>
              <p className="page-subtitle">Keep track of your students and their courses.</p>
            </div>
            <button className="primary-button" onClick={openCreateDialog}>
              <span className="plus">+</span> Add student
            </button>
          </div>

          <section className="stats-grid" aria-label="Student statistics">
            <article className="stat-card">
              <div className="stat-top"><span>Total students</span><span className="stat-icon purple">♙</span></div>
              <strong className="stat-value">{loading ? '—' : students.length}</strong>
              <span className="stat-foot">In your directory</span>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Active courses</span><span className="stat-icon blue">▤</span></div>
              <strong className="stat-value">{loading ? '—' : courses.length}</strong>
              <span className="stat-foot">Represented in your directory</span>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Average age</span><span className="stat-icon green">↗</span></div>
              <strong className="stat-value">{loading ? '—' : averageAge}</strong>
              <span className="stat-foot">Across all students</span>
            </article>
          </section>

          <section className="directory-card">
            <div className="directory-heading">
              <div>
                <h2>Student directory</h2>
                <p>View and manage your student records.</p>
              </div>
              <span className="record-count">{visibleStudents.length} {visibleStudents.length === 1 ? 'student' : 'students'}</span>
            </div>
            <div className="toolbar">
              <label className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="search"
                  placeholder="Search students..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search students"
                />
              </label>
              <label className="course-select-wrap">
                <span className="sr-only">Filter by course</span>
                <select id="courses" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                  <option>All courses</option>
                  {courses.map((course) => <option key={course}>{course}</option>)}
                </select>
              </label>
            </div>

            {loadError ? (
              <div className="state-panel error-panel">
                <div className="state-symbol">!</div>
                <h3>Couldn’t load students</h3>
                <p>{loadError}</p>
                <button className="secondary-button" onClick={loadStudents}>Try again</button>
              </div>
            ) : loading ? (
              <div className="state-panel"><span className="spinner" /><p>Loading your directory...</p></div>
            ) : visibleStudents.length === 0 ? (
              <div className="state-panel">
                <div className="state-symbol">♙</div>
                <h3>{students.length ? 'No students found' : 'Your directory is ready'}</h3>
                <p>{students.length ? 'Try another search or course filter.' : 'Add your first student to get started.'}</p>
                {!students.length && <button className="secondary-button" onClick={openCreateDialog}>Add your first student</button>}
              </div>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr><th>STUDENT</th><th>STUDENT ID</th><th>COURSE</th><th>AGE</th><th className="actions-heading">ACTIONS</th></tr>
                  </thead>
                  <tbody>
                    {visibleStudents.map((student, index) => (
                      <tr key={student._id}>
                        <td>
                          <div className="student-cell">
                            <span className={`student-avatar avatar-${index % 5}`}>{initials(student.name)}</span>
                            <span className="student-name">{student.name}</span>
                          </div>
                        </td>
                        <td><span className="student-id">STU-{String(student._id).slice(-6).toUpperCase()}</span></td>
                        <td><span className="course-pill">{student.course}</span></td>
                        <td className="age-cell">{student.age} years</td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-button" aria-label={`Edit ${student.name}`} title="Edit student" onClick={() => openEditDialog(student)}>✎</button>
                            <button className="icon-button delete-button" aria-label={`Delete ${student.name}`} title="Delete student" onClick={() => deleteStudent(student)}>×</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !loadError && students.length > 0 && (
              <div className="directory-footer">Showing <strong>{visibleStudents.length}</strong> of <strong>{students.length}</strong> students</div>
            )}
          </section>
          <footer className="page-footer">Made for better learning <span>✦</span></footer>
        </section>
      </main>

      {isDialogOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogStudent(undefined); }}>
          <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="student-dialog-title">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">{isEditing ? 'UPDATE RECORD' : 'NEW RECORD'}</div>
                <h2 id="student-dialog-title">{isEditing ? 'Edit student' : 'Add a student'}</h2>
                <p>{isEditing ? 'Update this student’s details.' : 'Fill in the details to add someone to your directory.'}</p>
              </div>
              <button className="modal-close" aria-label="Close dialog" onClick={() => setDialogStudent(undefined)}>×</button>
            </div>
            <form onSubmit={saveStudent}>
              <label className="form-field">
                <span>Full name</span>
                <input autoFocus required minLength="2" maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Alex Johnson" />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Age</span>
                  <input required type="number" min="1" max="120" value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })} placeholder="e.g. 20" />
                </label>
                <label className="form-field">
                  <span>Course</span>
                  <input required minLength="2" maxLength="80" value={form.course} onChange={(event) => setForm({ ...form, course: event.target.value })} placeholder="e.g. Information Technology" />
                </label>
              </div>
              {formError && <div className="form-error" role="alert">{formError}</div>}
              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setDialogStudent(undefined)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add student'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}

export default App;
