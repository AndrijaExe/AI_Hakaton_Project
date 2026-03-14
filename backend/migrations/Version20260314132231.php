<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260314132231 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notifications ADD event_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE notifications ADD CONSTRAINT FK_6000B0D371F7E88B FOREIGN KEY (event_id) REFERENCES events (id) NOT DEFERRABLE');
        $this->addSql('CREATE INDEX IDX_6000B0D371F7E88B ON notifications (event_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE notifications DROP CONSTRAINT FK_6000B0D371F7E88B');
        $this->addSql('DROP INDEX IDX_6000B0D371F7E88B');
        $this->addSql('ALTER TABLE notifications DROP event_id');
    }
}
