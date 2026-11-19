-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema sweetcode
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema sweetcode
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sweetcode` DEFAULT CHARACTER SET utf8 ;
USE `sweetcode` ;

-- -----------------------------------------------------
-- Table `sweetcode`.`usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`usuarios` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `apellidos` VARCHAR(45) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(45) NULL,
  `password_hash` VARCHAR(100) NOT NULL,
  `rol` VARCHAR(45) NOT NULL,
  `fecha_alta` TIMESTAMP NOT NULL,
  `ultimo_acceso` TIMESTAMP NOT NULL,
  `activo` TINYINT NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE,
  UNIQUE INDEX `id_usuario_UNIQUE` (`id_usuario` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`direcciones_entrega`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`direcciones_entrega` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`direcciones_entrega` (
  `id_direccion` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `calle` VARCHAR(45) NOT NULL,
  `ciudad` VARCHAR(45) NOT NULL,
  `codigo_postal` VARCHAR(45) NOT NULL,
  `pais` VARCHAR(45) NOT NULL,
  `principal` TINYINT NOT NULL,
  PRIMARY KEY (`id_direccion`),
  INDEX `fk_direcciones_entrega_usuarios_idx` (`id_usuario` ASC) VISIBLE,
  UNIQUE INDEX `id_direccion_UNIQUE` (`id_direccion` ASC) VISIBLE,
  CONSTRAINT `fk_direcciones_entrega_usuarios`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sweetcode`.`usuarios` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`pedidos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`pedidos` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`pedidos` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_direccion` INT NOT NULL,
  `fecha` TIMESTAMP NOT NULL,
  `estado` VARCHAR(45) NOT NULL,
  `importe_total` DECIMAL(10,2) NOT NULL,
  `observaciones` TEXT NULL,
  INDEX `fk_table1_usuarios1_idx` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_table1_direcciones_entrega1_idx` (`id_direccion` ASC) VISIBLE,
  PRIMARY KEY (`id_pedido`),
  UNIQUE INDEX `id_pedido_UNIQUE` (`id_pedido` ASC) VISIBLE,
  CONSTRAINT `fk_table1_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sweetcode`.`usuarios` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_table1_direcciones_entrega1`
    FOREIGN KEY (`id_direccion`)
    REFERENCES `sweetcode`.`direcciones_entrega` (`id_direccion`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`categorias`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`categorias` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`categorias` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_categoria`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`productos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`productos` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`productos` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `id_categoria` INT NOT NULL,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `iva` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL,
  `imagen` VARCHAR(45) NULL,
  `activo` TINYINT NOT NULL,
  `fecha_alta` TIMESTAMP NOT NULL,
  `fecha_baja` TIMESTAMP NULL,
  PRIMARY KEY (`id_producto`),
  UNIQUE INDEX `id_producto_UNIQUE` (`id_producto` ASC) VISIBLE,
  INDEX `fk_productos_categorias1_idx` (`id_categoria` ASC) VISIBLE,
  CONSTRAINT `fk_productos_categorias1`
    FOREIGN KEY (`id_categoria`)
    REFERENCES `sweetcode`.`categorias` (`id_categoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`lineas_pedido`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`lineas_pedido` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`lineas_pedido` (
  `id_linea` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_linea`),
  INDEX `fk_lneas_pedido_pedidos1_idx` (`id_pedido` ASC) VISIBLE,
  UNIQUE INDEX `id_lineaPedido_UNIQUE` (`id_linea` ASC) VISIBLE,
  INDEX `fk_lineas_pedido_productos1_idx` (`id_producto` ASC) VISIBLE,
  CONSTRAINT `fk_lneas_pedido_pedidos1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `sweetcode`.`pedidos` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_lineas_pedido_productos1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `sweetcode`.`productos` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`solicitudes_presupuesto`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`solicitudes_presupuesto` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`solicitudes_presupuesto` (
  `id_presupuesto` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_pedido` INT NULL,
  `fecha` TIMESTAMP NOT NULL,
  `tipo_evento` VARCHAR(45) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `precio_estimado` DECIMAL(10,2) NULL,
  `fecha_entrega` TIMESTAMP NOT NULL,
  `estado` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_presupuesto`),
  INDEX `fk_solicitudes_presupuesto_usuarios1_idx` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_solicitudes_presupuesto_pedidos1_idx` (`id_pedido` ASC) VISIBLE,
  CONSTRAINT `fk_solicitudes_presupuesto_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sweetcode`.`usuarios` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_solicitudes_presupuesto_pedidos1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `sweetcode`.`pedidos` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sweetcode`.`articulos`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sweetcode`.`articulos` ;

CREATE TABLE IF NOT EXISTS `sweetcode`.`articulos` (
  `id_articulos` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `id_categoria` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `contenido` TEXT NOT NULL,
  `etiquetas` VARCHAR(45) NOT NULL,
  `publicado` TINYINT NOT NULL,
  `fecha` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id_articulos`),
  INDEX `fk_articulos_usuarios1_idx` (`id_usuario` ASC) VISIBLE,
  INDEX `fk_articulos_categorias1_idx` (`id_categoria` ASC) VISIBLE,
  CONSTRAINT `fk_articulos_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `sweetcode`.`usuarios` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_articulos_categorias1`
    FOREIGN KEY (`id_categoria`)
    REFERENCES `sweetcode`.`categorias` (`id_categoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
