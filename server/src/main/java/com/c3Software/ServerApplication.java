package com.c3Software;

import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ServerApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(ServerApplication.class);
        app.setBannerMode(Banner.Mode.OFF);
        app.run(args);
    }
}
