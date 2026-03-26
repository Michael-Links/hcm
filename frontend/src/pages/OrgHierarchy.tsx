import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import ConfirmModal from '../components/ConfirmModal';
import CascadingOrgSelect from '../components/CascadingOrgSelect';

interface OrgTree {
  groups: Array<{
    id: number; name: string; code: string;
    entities: Array<{
      id: number; name: string; code: string;
      divisions: Array<{
        id: number; name: string; code: string;
        departments: Array<{
          id: number; name: string; code: string;
          positions: Array<{ id: number; title: string; code: string; is_active: boolean }>;
        }>;
      }>;
    }>;
  }>;
}

type OrgType = 'group' | 'entity' | 'division' | 'department' | 'position';

interface EditState {
  type: string;
  id: number;
  name: string;
  code: string;
  parentId: number;
}

interface DeleteState {
  type: string;
  id: number;
  label: string;
}

export default function OrgHierarchy() {
  const [tree, setTree] = useState<OrgTree>({ groups: [] });
  const [formType, setFormType] = useState<OrgType>('group');
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [cascadingParentId, setCascadingParentId] = useState(0);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleting, setDeleting] = useState<DeleteState | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = async () => {
    const res = await api.get('/api/org/tree');
    setTree(res.data);
  };

  useEffect(() => { load(); }, []);

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleParentChange = useCallback((parentId: number) => {
    setCascadingParentId(parentId);
  }, []);

  const handleAdd = async () => {
    setMsg('');
    try {
      const endpoints: Record<string, string> = {
        group: '/api/org/groups',
        entity: '/api/org/entities',
        division: '/api/org/divisions',
        department: '/api/org/departments',
        position: '/api/org/positions',
      };
      const parentKeyMap: Record<string, string> = {
        entity: 'group_id',
        division: 'entity_id',
        department: 'division_id',
        position: 'department_id',
      };

      let body: Record<string, unknown>;
      if (formType === 'group') {
        body = { name: formName, code: formCode };
      } else if (formType === 'position') {
        body = { title: formName, code: formCode, [parentKeyMap[formType]]: cascadingParentId };
      } else {
        body = { name: formName, code: formCode, [parentKeyMap[formType]]: cascadingParentId };
      }

      await api.post(endpoints[formType], body);
      setFormName('');
      setFormCode('');
      setCascadingParentId(0);
      setMsg('Created successfully!');
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Error creating item');
    }
  };

  const handleEdit = async () => {
    if (!editing) return;
    setMsg('');
    try {
      const endpointMap: Record<string, string> = {
        group: '/api/org/groups',
        entity: '/api/org/entities',
        division: '/api/org/divisions',
        department: '/api/org/departments',
        position: '/api/org/positions',
      };
      const parentKeyMap: Record<string, string> = {
        entity: 'group_id',
        division: 'entity_id',
        department: 'division_id',
        position: 'department_id',
      };
      const body: any = editing.type === 'position'
        ? { title: editing.name, code: editing.code, [parentKeyMap[editing.type]]: editing.parentId }
        : editing.type === 'group'
          ? { name: editing.name, code: editing.code }
          : { name: editing.name, code: editing.code, [parentKeyMap[editing.type]]: editing.parentId };

      await api.put(`${endpointMap[editing.type]}/${editing.id}`, body);
      setEditing(null);
      setMsg('Updated successfully!');
      load();
    } catch (err: any) {
      setMsg(err.response?.data?.detail || 'Error updating item');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setMsg('');
    try {
      const endpointMap: Record<string, string> = {
        group: '/api/org/groups',
        entity: '/api/org/entities',
        division: '/api/org/divisions',
        department: '/api/org/departments',
        position: '/api/org/positions',
      };
      await api.delete(`${endpointMap[deleting.type]}/${deleting.id}`);
      setDeleting(null);
      setMsg('Deleted successfully!');
      load();
    } catch (err: any) {
      setDeleting(null);
      setMsg(err.response?.data?.detail || 'Error deleting item');
    }
  };

  const editBtn = (type: string, id: number, name: string, code: string, parentId: number = 0) => (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing({ type, id, name, code, parentId }); }}
      className="ml-2 text-gray-400 hover:text-primary-600 text-xs" title="Edit">✏️</button>
  );

  const deleteBtn = (type: string, id: number, label: string) => (
    <button
      onClick={(e) => { e.stopPropagation(); setDeleting({ type, id, label }); }}
      className="ml-1 text-gray-400 hover:text-red-600 text-xs" title="Delete">🗑️</button>
  );

  const collapseToggle = (key: string, hasChildren: boolean) => {
    if (!hasChildren) return <span className="inline-block w-5" />;
    const isCollapsed = collapsed.has(key);
    return (
      <button
        onClick={(e) => { e.stopPropagation(); toggleCollapse(key); }}
        className="inline-block w-5 text-gray-400 hover:text-gray-600 text-xs select-none"
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? '▶' : '▼'}
      </button>
    );
  };

  const positionCountBadge = (count: number) => {
    if (count === 0) return null;
    return (
      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {count} pos.
      </span>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Organization Hierarchy</h1>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit {editing.type}</h3>
            <div className="space-y-3">
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder={editing.type === 'position' ? 'Title' : 'Name'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                placeholder="Code" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {editing.type !== 'group' && (
                <input type="number" value={editing.parentId} onChange={(e) => setEditing({ ...editing, parentId: Number(e.target.value) })}
                  placeholder="Parent ID" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleEdit} className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleting}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleting?.label}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      {/* Add form */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Add to Hierarchy</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as OrgType)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="group">Group</option>
            <option value="entity">Entity</option>
            <option value="division">Division</option>
            <option value="department">Department</option>
            <option value="position">Position</option>
          </select>
          <input placeholder="Name / Title" value={formName} onChange={(e) => setFormName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <input placeholder="Code" value={formCode} onChange={(e) => setFormCode(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <CascadingOrgSelect tree={tree} type={formType} onParentChange={handleParentChange} />
          <button onClick={handleAdd} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition">
            Add
          </button>
        </div>
        {msg && <p className={`mt-2 text-sm ${msg.includes('Error') || msg.includes('Cannot') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      </div>

      {/* Tree */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {tree.groups.length === 0 && <p className="text-gray-400">No hierarchy created yet.</p>}
        {tree.groups.map((g) => {
          const gKey = `group-${g.id}`;
          const gCollapsed = collapsed.has(gKey);
          return (
            <div key={g.id} className="mb-4">
              <div className="font-bold text-gray-800 flex items-center">
                {collapseToggle(gKey, g.entities.length > 0)}
                🏢 {g.name} <span className="text-xs text-gray-400 ml-1">({g.code})</span>
                {editBtn('group', g.id, g.name, g.code)}
                {deleteBtn('group', g.id, g.name)}
              </div>
              {!gCollapsed && g.entities.map((ent) => {
                const eKey = `entity-${ent.id}`;
                const eCollapsed = collapsed.has(eKey);
                return (
                  <div key={ent.id} className="ml-6 mt-1">
                    <div className="font-semibold text-gray-700 flex items-center">
                      {collapseToggle(eKey, ent.divisions.length > 0)}
                      🌐 {ent.name} <span className="text-xs text-gray-400 ml-1">({ent.code})</span>
                      {editBtn('entity', ent.id, ent.name, ent.code, g.id)}
                      {deleteBtn('entity', ent.id, ent.name)}
                    </div>
                    {!eCollapsed && ent.divisions.map((div) => {
                      const dKey = `division-${div.id}`;
                      const dCollapsed = collapsed.has(dKey);
                      return (
                        <div key={div.id} className="ml-6 mt-1">
                          <div className="text-gray-600 flex items-center">
                            {collapseToggle(dKey, div.departments.length > 0)}
                            📁 {div.name} <span className="text-xs text-gray-400 ml-1">({div.code})</span>
                            {editBtn('division', div.id, div.name, div.code, ent.id)}
                            {deleteBtn('division', div.id, div.name)}
                          </div>
                          {!dCollapsed && div.departments.map((dept) => {
                            const deptKey = `department-${dept.id}`;
                            const deptCollapsed = collapsed.has(deptKey);
                            return (
                              <div key={dept.id} className="ml-6 mt-1">
                                <div className="text-gray-500 flex items-center">
                                  {collapseToggle(deptKey, dept.positions.length > 0)}
                                  🏬 {dept.name} <span className="text-xs text-gray-400 ml-1">({dept.code})</span>
                                  {positionCountBadge(dept.positions.length)}
                                  {editBtn('department', dept.id, dept.name, dept.code, div.id)}
                                  {deleteBtn('department', dept.id, dept.name)}
                                </div>
                                {!deptCollapsed && dept.positions.map((p) => (
                                  <div key={p.id} className="ml-6 mt-0.5 text-sm text-gray-400 flex items-center">
                                    <span className="inline-block w-5" />
                                    💼 {p.title} <span className="text-xs ml-1">({p.code})</span>
                                    {!p.is_active && <span className="ml-1 text-xs text-red-400">(inactive)</span>}
                                    {editBtn('position', p.id, p.title, p.code, dept.id)}
                                    {deleteBtn('position', p.id, p.title)}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
