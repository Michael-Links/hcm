# Domain Model

## Organization Hierarchy
Group → Entity → Division → Department → Position

Positions define reporting and are mandatory for employees.

## User
- email
- password_hash
- role

## Employee
- employee_number
- position_id
- hire_date
- status

## Personal Info
- name
- gender
- date_of_birth

## Compensation
- packages
- recurring payments
- one-time payments
