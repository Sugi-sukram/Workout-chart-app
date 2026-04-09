import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExerciseData {
  id: string;
  name: string;
  description: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: string;
  equipment: string[];
  difficulty: string;
  instructions: string[];
  tips: string[];
  imageUrls: string[];
  videoUrl: string | null;
  isCompound: boolean;
  isUnilateral: boolean;
}

interface FoodData {
  id: string;
  name: string;
  brand: string | null;
  servingSize: number;
  servingUnit: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  barcode: string | null;
  imageUrl: string | null;
  isCustom: boolean;
  isVerified: boolean;
}

async function seedExercises() {
  console.log('[seed] Seeding exercises...');

  const exercisesPath = path.resolve(
    __dirname,
    '../../FitnessAIApp/src/data/exercises.json'
  );

  let exercises: ExerciseData[];
  try {
    const raw = fs.readFileSync(exercisesPath, 'utf-8');
    exercises = JSON.parse(raw);
  } catch {
    console.warn('[seed] Could not read exercises.json, using inline data');
    exercises = [];
  }

  if (exercises.length === 0) {
    console.warn('[seed] No exercises to seed');
    return [];
  }

  const created = [];
  for (const ex of exercises) {
    const exercise = await prisma.exercise.upsert({
      where: { id: ex.id },
      update: {
        name: ex.name,
        description: ex.description,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        category: ex.category,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        tips: ex.tips,
        imageUrls: ex.imageUrls,
        videoUrl: ex.videoUrl,
        isCompound: ex.isCompound,
        isUnilateral: ex.isUnilateral,
      },
      create: {
        id: ex.id,
        name: ex.name,
        description: ex.description,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        category: ex.category,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        tips: ex.tips,
        imageUrls: ex.imageUrls,
        videoUrl: ex.videoUrl,
        isCompound: ex.isCompound,
        isUnilateral: ex.isUnilateral,
      },
    });
    created.push(exercise);
  }

  console.log(`[seed] Seeded ${created.length} exercises`);
  return created;
}

async function seedFoods() {
  console.log('[seed] Seeding food items...');

  const foodsPath = path.resolve(
    __dirname,
    '../../FitnessAIApp/src/data/foods.json'
  );

  let foods: FoodData[];
  try {
    const raw = fs.readFileSync(foodsPath, 'utf-8');
    foods = JSON.parse(raw);
  } catch {
    console.warn('[seed] Could not read foods.json, using inline data');
    foods = [];
  }

  if (foods.length === 0) {
    console.warn('[seed] No foods to seed');
    return;
  }

  const created = [];
  for (const f of foods) {
    const food = await prisma.foodItem.upsert({
      where: { id: f.id },
      update: {
        name: f.name,
        brand: f.brand,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        calories: f.macros.calories,
        protein: f.macros.protein,
        carbs: f.macros.carbs,
        fat: f.macros.fat,
        fiber: f.macros.fiber,
        sugar: f.macros.sugar,
        sodium: f.macros.sodium,
        barcode: f.barcode,
        imageUrl: f.imageUrl,
        isCustom: f.isCustom,
        isVerified: f.isVerified,
      },
      create: {
        id: f.id,
        name: f.name,
        brand: f.brand,
        servingSize: f.servingSize,
        servingUnit: f.servingUnit,
        calories: f.macros.calories,
        protein: f.macros.protein,
        carbs: f.macros.carbs,
        fat: f.macros.fat,
        fiber: f.macros.fiber,
        sugar: f.macros.sugar,
        sodium: f.macros.sodium,
        barcode: f.barcode,
        imageUrl: f.imageUrl,
        isCustom: f.isCustom,
        isVerified: f.isVerified,
      },
    });
    created.push(food);
  }

  console.log(`[seed] Seeded ${created.length} food items`);
}

async function seedAchievements() {
  console.log('[seed] Seeding achievements...');

  const achievements = [
    { name: 'First Workout', description: 'Complete your first workout', category: 'workout', xpReward: 50, target: 1 },
    { name: '10 Workouts', description: 'Complete 10 workouts', category: 'workout', xpReward: 100, target: 10 },
    { name: '50 Workouts', description: 'Complete 50 workouts', category: 'workout', xpReward: 250, target: 50 },
    { name: '100 Workouts', description: 'Complete 100 workouts', category: 'milestone', xpReward: 500, target: 100 },
    { name: '7-Day Streak', description: 'Maintain a 7-day workout streak', category: 'streak', xpReward: 100, target: 7 },
    { name: '30-Day Streak', description: 'Maintain a 30-day workout streak', category: 'streak', xpReward: 300, target: 30 },
    { name: '100-Day Streak', description: 'Maintain a 100-day workout streak', category: 'streak', xpReward: 1000, target: 100 },
    { name: 'First Meal Logged', description: 'Log your first meal', category: 'nutrition', xpReward: 25, target: 1 },
    { name: '100 Meals Logged', description: 'Log 100 meals', category: 'nutrition', xpReward: 200, target: 100 },
    { name: 'Body Scan Complete', description: 'Log your first body measurement', category: 'milestone', xpReward: 50, target: 1 },
    { name: 'Weight Goal Reached', description: 'Reach your target weight', category: 'milestone', xpReward: 500, target: 1 },
    { name: 'First Personal Record', description: 'Set your first personal record', category: 'strength', xpReward: 100, target: 1 },
    { name: '10 Personal Records', description: 'Set 10 personal records', category: 'strength', xpReward: 250, target: 10 },
    { name: 'Hydration Hero', description: 'Meet your daily water goal 7 days in a row', category: 'nutrition', xpReward: 100, target: 7 },
    { name: 'Early Bird', description: 'Complete a workout before 7 AM', category: 'consistency', xpReward: 50, target: 1 },
    { name: 'Night Owl', description: 'Complete a workout after 10 PM', category: 'consistency', xpReward: 50, target: 1 },
    { name: 'Volume King', description: 'Lift a total volume of 100,000 kg', category: 'strength', xpReward: 500, target: 100000 },
    { name: 'Marathon Runner', description: 'Log 42.2 km of running', category: 'milestone', xpReward: 300, target: 42 },
    { name: 'Level 10', description: 'Reach level 10', category: 'milestone', xpReward: 200, target: 10 },
    { name: 'Level 25', description: 'Reach level 25', category: 'milestone', xpReward: 500, target: 25 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { id: `ach_${ach.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` },
      update: {
        name: ach.name,
        description: ach.description,
        category: ach.category,
        xpReward: ach.xpReward,
        target: ach.target,
      },
      create: {
        id: `ach_${ach.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name: ach.name,
        description: ach.description,
        category: ach.category,
        xpReward: ach.xpReward,
        target: ach.target,
      },
    });
  }

  console.log(`[seed] Seeded ${achievements.length} achievements`);
}

async function seedWorkoutTemplates(exerciseIds: string[]) {
  console.log('[seed] Seeding workout templates...');

  // Map exercise names to their IDs for template building
  // Use the IDs from seeded exercises
  const templates = [
    {
      name: 'Full Body',
      description: 'A complete full body workout hitting all major muscle groups',
      category: 'full_body',
      difficulty: 'beginner',
      estimatedDuration: 60,
      exercisesJson: [
        { exerciseId: 'ex_barbell_back_squat', orderIndex: 0, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_barbell_bench_press', orderIndex: 1, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_barbell_rows', orderIndex: 2, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_overhead_press', orderIndex: 3, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_romanian_deadlift', orderIndex: 4, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_plank', orderIndex: 5, sets: [{ setNumber: 1, duration: 60 }, { setNumber: 2, duration: 60 }, { setNumber: 3, duration: 60 }] },
      ],
    },
    {
      name: 'Push Day',
      description: 'Chest, shoulders, and triceps focused workout',
      category: 'push',
      difficulty: 'intermediate',
      estimatedDuration: 50,
      exercisesJson: [
        { exerciseId: 'ex_barbell_bench_press', orderIndex: 0, sets: [{ setNumber: 1, reps: 6 }, { setNumber: 2, reps: 6 }, { setNumber: 3, reps: 6 }, { setNumber: 4, reps: 6 }] },
        { exerciseId: 'ex_incline_dumbbell_press', orderIndex: 1, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_dumbbell_shoulder_press', orderIndex: 2, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_lateral_raises', orderIndex: 3, sets: [{ setNumber: 1, reps: 15 }, { setNumber: 2, reps: 15 }, { setNumber: 3, reps: 15 }] },
        { exerciseId: 'ex_cable_flyes', orderIndex: 4, sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, reps: 12 }, { setNumber: 3, reps: 12 }] },
        { exerciseId: 'ex_tricep_pushdowns', orderIndex: 5, sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, reps: 12 }, { setNumber: 3, reps: 12 }] },
        { exerciseId: 'ex_skull_crushers', orderIndex: 6, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
      ],
    },
    {
      name: 'Pull Day',
      description: 'Back and biceps focused workout',
      category: 'pull',
      difficulty: 'intermediate',
      estimatedDuration: 50,
      exercisesJson: [
        { exerciseId: 'ex_conventional_deadlift', orderIndex: 0, sets: [{ setNumber: 1, reps: 5 }, { setNumber: 2, reps: 5 }, { setNumber: 3, reps: 5 }] },
        { exerciseId: 'ex_pull_ups', orderIndex: 1, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_barbell_rows', orderIndex: 2, sets: [{ setNumber: 1, reps: 8 }, { setNumber: 2, reps: 8 }, { setNumber: 3, reps: 8 }] },
        { exerciseId: 'ex_lat_pulldown', orderIndex: 3, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_face_pulls', orderIndex: 4, sets: [{ setNumber: 1, reps: 15 }, { setNumber: 2, reps: 15 }, { setNumber: 3, reps: 15 }] },
        { exerciseId: 'ex_barbell_curls', orderIndex: 5, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_hammer_curls', orderIndex: 6, sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, reps: 12 }, { setNumber: 3, reps: 12 }] },
      ],
    },
    {
      name: 'Leg Day',
      description: 'Quadriceps, hamstrings, glutes, and calves focused workout',
      category: 'legs',
      difficulty: 'intermediate',
      estimatedDuration: 55,
      exercisesJson: [
        { exerciseId: 'ex_barbell_back_squat', orderIndex: 0, sets: [{ setNumber: 1, reps: 6 }, { setNumber: 2, reps: 6 }, { setNumber: 3, reps: 6 }, { setNumber: 4, reps: 6 }] },
        { exerciseId: 'ex_leg_press', orderIndex: 1, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_romanian_deadlift', orderIndex: 2, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_bulgarian_split_squats', orderIndex: 3, sets: [{ setNumber: 1, reps: 10 }, { setNumber: 2, reps: 10 }, { setNumber: 3, reps: 10 }] },
        { exerciseId: 'ex_leg_curls', orderIndex: 4, sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, reps: 12 }, { setNumber: 3, reps: 12 }] },
        { exerciseId: 'ex_leg_extensions', orderIndex: 5, sets: [{ setNumber: 1, reps: 12 }, { setNumber: 2, reps: 12 }, { setNumber: 3, reps: 12 }] },
        { exerciseId: 'ex_calf_raises', orderIndex: 6, sets: [{ setNumber: 1, reps: 15 }, { setNumber: 2, reps: 15 }, { setNumber: 3, reps: 15 }, { setNumber: 4, reps: 15 }] },
      ],
    },
  ];

  for (const tmpl of templates) {
    const templateId = `tmpl_${tmpl.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
    await prisma.workoutTemplate.upsert({
      where: { id: templateId },
      update: {
        name: tmpl.name,
        description: tmpl.description,
        category: tmpl.category,
        difficulty: tmpl.difficulty,
        estimatedDuration: tmpl.estimatedDuration,
        exercisesJson: tmpl.exercisesJson,
        isDefault: true,
      },
      create: {
        id: templateId,
        name: tmpl.name,
        description: tmpl.description,
        category: tmpl.category,
        difficulty: tmpl.difficulty,
        estimatedDuration: tmpl.estimatedDuration,
        exercisesJson: tmpl.exercisesJson,
        isDefault: true,
      },
    });
  }

  console.log(`[seed] Seeded ${templates.length} workout templates`);
}

async function main() {
  console.log('[seed] Starting database seed...');

  const exercises = await seedExercises();
  await seedFoods();
  await seedAchievements();
  await seedWorkoutTemplates(exercises.map((e) => e.id));

  console.log('[seed] Database seeding complete!');
}

main()
  .catch((error) => {
    console.error('[seed] Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
