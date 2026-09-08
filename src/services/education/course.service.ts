import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface SearchCoursesFilters {
  field?: string;
  level?: string;
  country?: string;
  city?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export class CourseService {
  async searchCourses(filters: SearchCoursesFilters) {
    const { field, level, country, city, keyword, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    if (level) {
      where.degree = { contains: level };
    }

    const uniWhere: Prisma.UniversityWhereInput = {};
    if (country) uniWhere.country = { contains: country };
    if (city) uniWhere.city = { contains: city };
    if (Object.keys(uniWhere).length > 0) {
      where.university = uniWhere;
    }

    const conditions: Prisma.CourseWhereInput[] = [];

    if (keyword) {
      conditions.push({
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      });
    }

    if (field) {
      conditions.push({
        department: { equals: field },
      });
    }

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        Object.assign(where, conditions[0]);
      } else {
        where.AND = conditions;
      }
    }

    const [data, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          university: {
            select: {
              id: true,
              name: true,
              country: true,
              city: true,
              logoUrl: true,
              type: true,
              ranking: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getCourseById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        university: true,
        admissionRequirements: {
          include: {
            country: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new Error(`Course with id "${id}" not found`);
    }

    return course;
  }

  async getCourseFields() {
    const careerPaths = await prisma.careerPath.findMany({
      select: { field: true },
      distinct: ['field'],
      orderBy: { field: 'asc' },
    });

    return careerPaths.map((cp) => cp.field);
  }

  async getCourseLevels() {
    return [
      'certificate',
      'diploma',
      'associate',
      'bachelor',
      'master',
      'mphil',
      'phd',
    ];
  }

  async getCareerPathsByCourse(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { name: true, degree: true, description: true },
    });

    if (!course) {
      throw new Error(`Course with id "${courseId}" not found`);
    }

    const keywords = [
      course.degree,
      ...course.name.split(/\s+/).filter((w) => w.length > 3),
    ];

    const careerPaths = await prisma.careerPath.findMany({
      where: {
        OR: keywords.map((keyword) => ({
          field: { contains: keyword, mode: 'insensitive' as const },
        })),
      },
      orderBy: { title: 'asc' },
    });

    return careerPaths;
  }
}

export const courseService = new CourseService();
