import { useEffect, useState } from 'react';

interface Position { id: number; title: string; code: string; is_active: boolean }
interface Department { id: number; name: string; code: string; positions: Position[] }
interface Division { id: number; name: string; code: string; departments: Department[] }
interface Entity { id: number; name: string; code: string; divisions: Division[] }
interface Group { id: number; name: string; code: string; entities: Entity[] }

interface OrgTree {
  groups: Group[];
}

type OrgType = 'group' | 'entity' | 'division' | 'department' | 'position';

interface CascadingOrgSelectProps {
  tree: OrgTree;
  type: OrgType;
  onParentChange: (parentId: number) => void;
}

const selectClass = 'px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-w-[160px]';

export default function CascadingOrgSelect({ tree, type, onParentChange }: CascadingOrgSelectProps) {
  const [selectedGroup, setSelectedGroup] = useState<number>(0);
  const [selectedEntity, setSelectedEntity] = useState<number>(0);
  const [selectedDivision, setSelectedDivision] = useState<number>(0);
  const [selectedDepartment, setSelectedDepartment] = useState<number>(0);

  const entityOptions = tree.groups.find(g => g.id === selectedGroup)?.entities || [];
  const divisionOptions = entityOptions.find(e => e.id === selectedEntity)?.divisions || [];
  const departmentOptions = divisionOptions.find(d => d.id === selectedDivision)?.departments || [];

  // Reset all selections when type changes
  useEffect(() => {
    setSelectedGroup(0);
    setSelectedEntity(0);
    setSelectedDivision(0);
    setSelectedDepartment(0);
    onParentChange(0);
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Propagate the correct parent ID whenever selections change
  useEffect(() => {
    let parentId = 0;
    switch (type) {
      case 'entity':
        parentId = selectedGroup;
        break;
      case 'division':
        parentId = selectedEntity;
        break;
      case 'department':
        parentId = selectedDivision;
        break;
      case 'position':
        parentId = selectedDepartment;
        break;
    }
    onParentChange(parentId);
  }, [type, selectedGroup, selectedEntity, selectedDivision, selectedDepartment]); // eslint-disable-line react-hooks/exhaustive-deps

  if (type === 'group') return null;

  const needsGroup = ['entity', 'division', 'department', 'position'].includes(type);
  const needsEntity = ['division', 'department', 'position'].includes(type);
  const needsDivision = ['department', 'position'].includes(type);
  const needsDepartment = type === 'position';

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {needsGroup && (
        <select
          value={selectedGroup}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelectedGroup(val);
            setSelectedEntity(0);
            setSelectedDivision(0);
            setSelectedDepartment(0);
          }}
          className={selectClass}
        >
          <option value={0}>— Select Group —</option>
          {tree.groups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.code})</option>
          ))}
        </select>
      )}

      {needsEntity && (
        <select
          value={selectedEntity}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelectedEntity(val);
            setSelectedDivision(0);
            setSelectedDepartment(0);
          }}
          className={selectClass}
          disabled={!selectedGroup}
        >
          <option value={0}>— Select Entity —</option>
          {entityOptions.map(e => (
            <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
          ))}
        </select>
      )}

      {needsDivision && (
        <select
          value={selectedDivision}
          onChange={(e) => {
            const val = Number(e.target.value);
            setSelectedDivision(val);
            setSelectedDepartment(0);
          }}
          className={selectClass}
          disabled={!selectedEntity}
        >
          <option value={0}>— Select Division —</option>
          {divisionOptions.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
          ))}
        </select>
      )}

      {needsDepartment && (
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(Number(e.target.value))}
          className={selectClass}
          disabled={!selectedDivision}
        >
          <option value={0}>— Select Department —</option>
          {departmentOptions.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
          ))}
        </select>
      )}
    </div>
  );
}
