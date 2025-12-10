FROM gradle:8.10-jdk17 AS build
WORKDIR /app

# 프로젝트 메타/래퍼 복사
COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle gradle

# 소스 복사
COPY src src

RUN chmod +x gradlew
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app

# 업로드 디렉터리 보존용
RUN mkdir -p /app/uploads

COPY --from=build /app/build/libs/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8042

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
