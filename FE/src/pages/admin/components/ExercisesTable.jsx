export default function ExercisesTable({ exercises = [], onEdit, onDelete }) {
  if (!exercises || exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No exercises found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-slate-800">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Name</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Muscle Group</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Sets</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Reps</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Rest (sec)</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Status</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise._id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
              <td className="px-6 py-4 text-slate-200 font-medium">{exercise.name}</td>
              <td className="px-6 py-4 text-slate-300 capitalize">{exercise.muscleGroup}</td>
              <td className="px-6 py-4 text-slate-300">{exercise.sets}</td>
              <td className="px-6 py-4 text-slate-300">{exercise.reps}</td>
              <td className="px-6 py-4 text-slate-300">{exercise.restTime}</td>
              <td className="px-6 py-4">
                <span className={exercise.isDeleted ? 'text-red-400' : 'text-emerald-400'}>
                  {exercise.isDeleted ? 'Deleted' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 space-x-2">
                <button
                  onClick={() => onEdit(exercise._id, exercise)}
                  className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(exercise._id, exercise.name)}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
